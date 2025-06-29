# Digi+ v2 – Full PRD  
**Stack** Next.js 15 (App Router) • Supabase (DB + Auth + Storage) • Tailwind CSS v4 • shadcn/ui  
**Deploy** Vercel (front‑end) • Supabase (managed back‑end)  
**Auth** Google OAuth only • No magic links • Global **AuthContext** for session sharing  
**Roles** `admin`, `student`

---

## 1 · Vision
Build a modern, maintainable learning platform.  
*Admins* create/manage courses, lessons, quizzes and PDF certificates.  
*Students* log in with Google, consume lessons, pass quizzes, and download certificates.

---

## 2 · Success Metrics
| KPI | Target |
|-----|--------|
| Auth latency (TTFB) | < 120 ms |
| Course publish time | ≤ 3 min |
| Progress events stored | ≥ 99 % |
| Mobile Lighthouse | ≥ 90 |

---

## 3 · Personas
| Persona | Key Story |
|---------|-----------|
| **Admin**   | „Ich möchte Kurse → Lektionen → Quizze anlegen, Fortschritt sehen & Zertifikate verwalten.“ |
| **Student** | „Ich logge mich via Google ein, lerne, bestehe Quizze und erhalte mein Zertifikat.“ |

---

## 4 · Information Architecture

```
Course
 ├─ Lesson (markdown + optional video_url)
 │   └─ Quiz (optional)
 └─ Certificate (PDF upload)
```

---

## 5 · Supabase Schema (DDL excerpt)

```sql
-- 5.1 Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','student')) default 'student',
  created_at timestamptz default now()
);

-- 5.2 Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  hero_image text,
  admin_id uuid references profiles(id),
  status text check (status in ('draft','published')) default 'draft',
  created_at timestamptz default now()
);

-- 5.3 Lessons
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  sort_order int,
  title text,
  markdown text,
  video_url text
);

-- 5.4 Quizzes, Questions, Options
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  title text,
  pass_pct int default 80
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question text,
  type text check (type in ('single','multiple'))
);

create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  option_text text,
  is_correct boolean default false
);

-- 5.5 Progress & Attempts
create table lesson_progress (
  student_id uuid references profiles(id),
  lesson_id uuid references lessons(id),
  completed_at timestamptz default now(),
  primary key (student_id, lesson_id)
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  quiz_id uuid references quizzes(id),
  score int,
  passed boolean,
  attempted_at timestamptz default now()
);

create table answers (
  attempt_id uuid references quiz_attempts(id) on delete cascade,
  question_id uuid references questions(id),
  option_id uuid references options(id)
);

-- 5.6 Certificates
create table certificates (
  student_id uuid references profiles(id),
  course_id uuid references courses(id),
  file_url text,
  issued_at timestamptz default now(),
  primary key (student_id, course_id)
);
```

### 5.1 RLS Policies (sample)

```sql
alter table courses enable row level security;

create policy "Admins manage" on courses
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Students read published" on courses
  for select using ( status = 'published' );
```

(Apply similar read/write policies to lessons, quizzes, etc.)

---

## 6 · Routing Map

| Route | Role | Component |
|-------|------|-----------|
| `/dashboard`         | student | `<StudentDashboard>` |
| `/course/[id]`       | student | `<CourseOverview>` |
| `/lesson/[id]`       | student | `<LessonPage>` |
| `/admin`             | admin   | `<AdminHome>` |
| `/admin/courses/new` | admin   | Course wizard |
| `/admin/courses/[id]`| admin   | Course editor |

`middleware.ts` redirects based on session & role.

---

## 7 · Global AuthContext

```tsx
import { createContext, useContext, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSession } from '@supabase/auth-helpers-react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AuthCtx = { session: any; role: 'admin' | 'student' | null };
export const AuthContext = createContext<AuthCtx>({ session: null, role: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data } = useSession();
  const role = data?.session?.user.user_metadata.role ?? null;
  return (
    <AuthContext.Provider value={{ session: data?.session, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

Wrap in `app/layout.tsx`:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

## 8 · Component Inventory
* **Navbar** – role‑aware  
* **CourseCard** – hero image + progress  
* **VideoPlayer** – native / YouTube  
* **QuizForm** – radio / checkbox, auto‑score  
* **AdminWizard** – multi‑step (details, lessons, quiz)  

---

## 9 · Styling Tokens
* Primary `#dd0547`  
* Secondary `#003670`  
* Container: `max-w-[900px] mx-auto px-4`  

Tabs via shadcn `<Tabs>`:  

```css
.tabs-trigger[data-state="active"]{
  @apply text-pink-600 border-b-4 border-pink-600 font-semibold;
}
```

---

## 10 · Certificate Flow
1. Student completes all lessons **and** passes quizzes.  
2. RPC `issue_certificate(course_id)` inserts row in `certificates`.  
3. Supabase Edge Function generates PDF → Storage.  
4. Dashboard shows “Download Certificate”.

---

## 11 · Deployment
| Layer | Service |
|-------|---------|
| Front‑end | Vercel |
| DB/Auth/Storage | Supabase |

Env vars in Vercel:  
- `NEXT_PUBLIC_SUPABASE_URL`  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE` (for Edge functions)

---

## 12 · Timeline (6‑Week MVP)

| Week | Deliverable |
|------|-------------|
| 1 | Repo init, schema, Google OAuth |
| 2 | AuthProvider, middleware, navbar |
| 3 | Student dashboard & CourseCard |
| 4 | Lesson page, progress, QuizForm |
| 5 | Admin wizard CRUD |
| 6 | Certificates, polish |

---

## 13 · Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| RLS misconfig | Unit tests with Supabase JS |
| Video bandwidth | Start with YouTube embed |
| PDF cold start | Pre‑warm Edge function |
