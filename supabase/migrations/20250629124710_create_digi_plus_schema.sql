-- Digi+ v2 Learning Platform Schema
-- Based on PRD requirements

-- Enable RLS on auth.users (should already be enabled, but let's be explicit)
-- Note: auth.users is managed by Supabase Auth

-- 1. Profiles table - User roles and metadata
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','student')) default 'student',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Courses table - Admin-created courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  hero_image text, -- URL to stored image
  admin_id uuid references profiles(id),
  status text check (status in ('draft','published')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Lessons table - Course content
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  sort_order int not null default 0,
  title text not null,
  markdown text, -- Lesson content in markdown format
  video_url text, -- Optional YouTube or other video URL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Quizzes table - Optional quizzes per lesson
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  title text not null,
  pass_pct int default 80, -- Percentage needed to pass
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Questions table - Quiz questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question text not null,
  type text check (type in ('single','multiple')) not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 6. Options table - Answer options for questions
create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 7. Lesson Progress table - Track student lesson completion
create table lesson_progress (
  student_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (student_id, lesson_id)
);

-- 8. Quiz Attempts table - Track student quiz attempts
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  score int not null, -- Score as percentage
  passed boolean not null,
  attempted_at timestamptz default now()
);

-- 9. Answers table - Student answers for quiz attempts
create table answers (
  attempt_id uuid references quiz_attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  primary key (attempt_id, question_id, option_id)
);

-- 10. Certificates table - Issued certificates
create table certificates (
  student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  file_url text, -- URL to generated PDF certificate
  issued_at timestamptz default now(),
  primary key (student_id, course_id)
);

-- Create indexes for better performance
create index idx_courses_admin_id on courses(admin_id);
create index idx_courses_status on courses(status);
create index idx_lessons_course_id on lessons(course_id);
create index idx_lessons_sort_order on lessons(course_id, sort_order);
create index idx_quizzes_lesson_id on quizzes(lesson_id);
create index idx_questions_quiz_id on questions(quiz_id);
create index idx_questions_sort_order on questions(quiz_id, sort_order);
create index idx_options_question_id on options(question_id);
create index idx_quiz_attempts_student_quiz on quiz_attempts(student_id, quiz_id);
create index idx_lesson_progress_student on lesson_progress(student_id);

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table lesson_progress enable row level security;
alter table quiz_attempts enable row level security;
alter table answers enable row level security;
alter table certificates enable row level security;

-- RLS Policies

-- Profiles: Users can read their own profile, admins can read all
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Admins can read all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Courses: Admins can manage all, students can read published
create policy "Admins can manage courses" on courses
  for all using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Students can read published courses" on courses
  for select using (status = 'published');

-- Lessons: Admins can manage all, students can read lessons of published courses
create policy "Admins can manage lessons" on lessons
  for all using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Students can read lessons of published courses" on lessons
  for select using (
    exists (
      select 1 from courses where id = lessons.course_id and status = 'published'
    )
  );

-- Quizzes: Same pattern as lessons
create policy "Admins can manage quizzes" on quizzes
  for all using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Students can read quizzes of published courses" on quizzes
  for select using (
    exists (
      select 1 from lessons l
      join courses c on c.id = l.course_id
      where l.id = quizzes.lesson_id and c.status = 'published'
    )
  );

-- Questions: Same pattern
create policy "Admins can manage questions" on questions
  for all using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Students can read questions of published courses" on questions
  for select using (
    exists (
      select 1 from quizzes q
      join lessons l on l.id = q.lesson_id
      join courses c on c.id = l.course_id
      where q.id = questions.quiz_id and c.status = 'published'
    )
  );

-- Options: Same pattern
create policy "Admins can manage options" on options
  for all using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Students can read options of published courses" on options
  for select using (
    exists (
      select 1 from questions q
      join quizzes qz on qz.id = q.quiz_id
      join lessons l on l.id = qz.lesson_id
      join courses c on c.id = l.course_id
      where q.id = options.question_id and c.status = 'published'
    )
  );

-- Lesson Progress: Students can manage their own progress, admins can read all
create policy "Students can manage own progress" on lesson_progress
  for all using (auth.uid() = student_id);

create policy "Admins can read all progress" on lesson_progress
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Quiz Attempts: Students can manage their own attempts, admins can read all
create policy "Students can manage own quiz attempts" on quiz_attempts
  for all using (auth.uid() = student_id);

create policy "Admins can read all quiz attempts" on quiz_attempts
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Answers: Students can manage their own answers, admins can read all
create policy "Students can manage own answers" on answers
  for all using (
    exists (
      select 1 from quiz_attempts qa
      where qa.id = answers.attempt_id and qa.student_id = auth.uid()
    )
  );

create policy "Admins can read all answers" on answers
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Certificates: Students can read their own certificates, admins can read all
create policy "Students can read own certificates" on certificates
  for select using (auth.uid() = student_id);

create policy "Admins can read all certificates" on certificates
  for select using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "System can insert certificates" on certificates
  for insert with check (true); -- Will be handled by RPC functions

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_courses_updated_at before update on courses
  for each row execute function update_updated_at_column();

create trigger update_lessons_updated_at before update on lessons
  for each row execute function update_updated_at_column();

create trigger update_quizzes_updated_at before update on quizzes
  for each row execute function update_updated_at_column();

-- Function to handle user registration (create profile automatically)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function to check if student can get certificate
create or replace function can_issue_certificate(course_id_param uuid, student_id_param uuid)
returns boolean as $$
declare
  total_lessons int;
  completed_lessons int;
  required_quizzes int;
  passed_quizzes int;
begin
  -- Count total lessons in course
  select count(*) into total_lessons
  from lessons
  where course_id = course_id_param;

  -- Count completed lessons by student
  select count(*) into completed_lessons
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where l.course_id = course_id_param and lp.student_id = student_id_param;

  -- Count required quizzes (lessons that have quizzes)
  select count(*) into required_quizzes
  from lessons l
  join quizzes q on q.lesson_id = l.id
  where l.course_id = course_id_param;

  -- Count passed quizzes by student
  select count(distinct q.id) into passed_quizzes
  from lessons l
  join quizzes q on q.lesson_id = l.id
  join quiz_attempts qa on qa.quiz_id = q.id
  where l.course_id = course_id_param
    and qa.student_id = student_id_param
    and qa.passed = true;

  -- Student must complete all lessons AND pass all required quizzes
  return (completed_lessons = total_lessons) and (passed_quizzes = required_quizzes);
end;
$$ language plpgsql security definer;

-- Function to issue certificate
create or replace function issue_certificate(course_id_param uuid)
returns json as $$
declare
  student_id_param uuid := auth.uid();
  can_issue boolean;
  existing_cert boolean;
begin
  -- Check if student is authenticated
  if student_id_param is null then
    return json_build_object('success', false, 'message', 'Not authenticated');
  end if;

  -- Check if student can get certificate
  select can_issue_certificate(course_id_param, student_id_param) into can_issue;

  if not can_issue then
    return json_build_object('success', false, 'message', 'Requirements not met');
  end if;

  -- Check if certificate already exists
  select exists(
    select 1 from certificates
    where student_id = student_id_param and course_id = course_id_param
  ) into existing_cert;

  if existing_cert then
    return json_build_object('success', false, 'message', 'Certificate already issued');
  end if;

  -- Insert certificate (file_url will be updated by Edge Function)
  insert into certificates (student_id, course_id, file_url)
  values (student_id_param, course_id_param, null);

  return json_build_object('success', true, 'message', 'Certificate issued');
end;
$$ language plpgsql security definer;
