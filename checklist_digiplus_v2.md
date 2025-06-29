# Digi+ v2 — Exhaustive Build Checklist

Use this file as a master TODO inside Cursor. Tick each box as you deliver.

---

## 0 · Toolchain & Repo
- [ ] Create repo `digi-plus`
- [ ] `pnpm create next-app --ts --app`
- [ ] Install Tailwind v4 & init (`tailwind.config.js`)
- [ ] Install shadcn/ui (`npx shadcn-ui@latest init`)
- [ ] Install packages  
  - [ ] `@supabase/ssr` + `@supabase/auth-helpers-react`  
  - [ ] `react-markdown rehype-raw`  
  - [ ] `@react-pdf/renderer`  
  - [ ] `lucide-react`
- [ ] Prettier + ESLint config committed

---

## 1 · Supabase
### 1.1 Project
- [ ] Create project (eu-central)
- [ ] Enable Google OAuth
- [ ] Add service role key to Vercel secrets

### 1.2 Schema
- [ ] Execute `sql/schema.sql` (from PRD §5)
- [ ] Enable RLS on all tables
- [ ] Policies  
  - [ ] Profiles self/admin  
  - [ ] Courses read published  
  - [ ] Lessons/quizzes same
- [ ] RPC `issue_certificate`
- [ ] Storage bucket `certificates`

---

## 2 · Auth & Context
- [ ] Implement **AuthProvider** (see PRD §7)
- [ ] Wrap in `app/layout.tsx`
- [ ] `middleware.ts` role redirects  
  - [ ] `/admin` only admin  
  - [ ] `/dashboard` only student  
  - [ ] unauth → `/login`

---

## 3 · Global UI
- [ ] `<AppNavbar>` role‑aware
- [ ] Global container class (Tailwind)
- [ ] Theme colors in `tailwind.config.js`

---

## 4 · Student Flow
### 4.1 `/dashboard`
- [ ] Fetch `courses(status='published')`
- [ ] `<CourseCard>` progress bar
- [ ] Responsive grid

### 4.2 `/course/[id]`
- [ ] Display course hero, lessons list
- [ ] Progress bar per lesson
- [ ] Certificate download (if exists)

### 4.3 `/lesson/[id]`
- [ ] Markdown render + VideoPlayer
- [ ] “Mark lesson done” (insert lesson_progress)
- [ ] If quiz exists → show QuizForm

### 4.4 QuizForm
- [ ] Render questions/options
- [ ] Auto‑score, store `quiz_attempts`
- [ ] On pass → call `issue_certificate`

---

## 5 · Admin Flow
### 5.1 `/admin`
- [ ] Stats cards (course count, certs issued)
- [ ] Table of courses with edit button

### 5.2 Wizard `/admin/courses/new`
1. **Details** (title, desc, hero img)  
2. **Lessons** (repeatable inputs)  
3. **Quiz builder** per lesson  
4. **Publish**

### 5.3 Course Editor `/admin/courses/[id]`
- [ ] Edit lessons & quizzes
- [ ] Upload certificate PDF

---

## 6 · Edge Functions
- [ ] `generate-pdf.ts` – receives JSON, returns PDF URL
- [ ] Protect via service role JWT
- [ ] Schedule Vercel Cron to ping every 5 min

---

## 7 · Tests
- [ ] Jest unit tests for RLS
- [ ] Cypress flow: login → complete lesson → quiz → cert
- [ ] Lighthouse CI (mobile ≥ 90)

---

## 8 · Deployment
- [ ] Connect repo to Vercel
- [ ] Env vars (URL, ANON, SERVICE_ROLE)
- [ ] Preview → staging → prod
- [ ] DNS cutover

---

## 9 · Post‑Launch / Future
- [ ] Add `trainer` role (phase 2)
- [ ] Multi‑language / MDX
- [ ] Push notifications (Supabase Realtime)
