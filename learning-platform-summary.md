# 📚 Learning Platform – Structure & Logic

## 🚀 Stack
- **Frontend**: Next.js 15 App Router + Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + RLS)
- **UI Libraries**: Shadcn UI, Lucide Icons

---

## 🧠 Content Hierarchy

```
Module → Course → Lecture
                ↓
              Quiz
```

---

## 🗃️ Supabase Schema (Normalized)

### `modules`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| title        | Text     |
| description  | Text     |

### `courses`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| module_id    | UUID     |
| title        | Text     |
| description  | Text     |
| order        | Integer  |

### `lectures`
| Field          | Type     |
|----------------|----------|
| id             | UUID     |
| course_id      | UUID     |
| title          | Text     |
| content        | Text     |
| duration_minutes | Integer |
| order          | Integer  |

### `quizzes`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| course_id    | UUID     |
| title        | Text     |
| passing_score| Integer  |
| order        | Integer  |

### `quiz_questions`
| Field          | Type     |
|----------------|----------|
| id             | UUID     |
| quiz_id        | UUID     |
| question_text  | Text     |
| question_type  | Text     |

### `quiz_answers`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| question_id   | UUID     |
| answer_text   | Text     |
| is_correct    | Boolean  |

### `user_progress`
| Field         | Type     |
|---------------|----------|
| id            | UUID     |
| user_id       | UUID     |
| lecture_id    | UUID     |
| completed_at  | Timestamp|

### `user_quiz_attempts`
| Field        | Type     |
|--------------|----------|
| id           | UUID     |
| user_id      | UUID     |
| quiz_id      | UUID     |
| score        | Integer  |
| passed       | Boolean  |
| submitted_at | Timestamp|

### `certificates`
| Field           | Type     |
|------------------|----------|
| id               | UUID     |
| user_id          | UUID     |
| course_id        | UUID     |
| certificate_url  | Text     |
| issued_at        | Timestamp|

---

## 👥 Roles via Supabase Auth

### `profiles`
| Field | Type |
|-------|------|
| id    | UUID |
| role  | ENUM (`admin`, `student`) |

- **Admin**: Full CRUD on all course content, view all user progress & issue certificates.
- **Student**: View content, take quizzes, download certificates.

---

## 🧾 Certificates

- Automatically generated when:
  - All lectures in a course are completed
  - All quizzes are passed
- PDF contains:
  - Name, Course, Date, QR code / unique ID
  - Downloadable from frontend

---

## 📊 Dashboard (Admin)
- View and manage all Modules / Courses
- Manage content (Lectures, Quizzes)
- See learner progress & scores
- Issue certificates manually (optional override)

---

## ✅ UI/UX Notes
- Sidebar showing Module > Courses > Lectures/Quizzes (with completion ticks)
- Each item has estimated time display
- Quizzes show immediate feedback
- Certificate screen allows download + share
- Fully mobile responsive

---

## 🔄 Future Enhancements
- Translations per course (JSON based)
- Sequential unlocking
- Certificates stored in Supabase Storage
