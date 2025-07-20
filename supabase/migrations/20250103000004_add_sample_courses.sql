-- Add sample courses to replace dummy data
INSERT INTO courses (id, title, description, status, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'SEO Mastery',
  'Complete guide to Search Engine Optimization',
  'published',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Social Media Marketing',
  'Learn to market effectively on social platforms',
  'published',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'HTML & CSS Basics',
  'Build your first website with HTML and CSS',
  'published',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'JavaScript Fundamentals',
  'Learn programming with JavaScript',
  'published',
  NOW(),
  NOW()
);