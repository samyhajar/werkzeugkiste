# Quiz Data Import Checklist

## Overview

This guide provides step-by-step instructions for importing WordPress/LearnDash quiz data into the new enhanced quiz schema.

## Pre-Import Setup

### 1. Database Migration

- [ ] Run the migration: `supabase db push`
- [ ] Verify new tables are created: `enhanced_quizzes`, `quiz_questions`, `quiz_answers`, `enhanced_quiz_attempts`, `rewards`
- [ ] Verify staging tables are created: `wp_quizzes_raw`, `wp_questions_raw`, `wp_answers_raw`

### 2. CSV Export from WordPress/LearnDash

Export the following data from your WordPress/LearnDash installation:

#### Quizzes CSV (`wp_quizzes_raw`)

Required columns:

- `id` (TEXT) - WordPress post ID or quiz_pro_id
- `title` (TEXT) - Quiz title
- `description` (TEXT) - Quiz description
- `course_id` (TEXT) - Associated course ID (if course-scoped)
- `lesson_id` (TEXT) - Associated lesson ID (if lesson-scoped)
- `pass_percent` (NUMERIC) - Passing percentage (0-100)
- `max_points` (INTEGER) - Maximum possible points
- `feedback_mode` (TEXT) - 'per_question', 'at_end', or 'none'
- `sort_order` (INTEGER) - Display order
- `settings` (JSONB) - Additional LearnDash settings

#### Questions CSV (`wp_questions_raw`)

Required columns:

- `id` (TEXT) - WordPress post ID
- `quiz_id` (TEXT) - Reference to quiz ID
- `question_html` (TEXT) - Question content (HTML allowed)
- `explanation_html` (TEXT) - Explanation/feedback (HTML allowed)
- `type` (TEXT) - Question type (will be normalized)
- `points` (INTEGER) - Points for this question
- `category` (TEXT) - Question category
- `sort_order` (INTEGER) - Display order
- `meta` (JSONB) - Additional metadata

#### Answers CSV (`wp_answers_raw`)

Required columns:

- `id` (TEXT) - WordPress post ID
- `question_id` (TEXT) - Reference to question ID
- `answer_html` (TEXT) - Answer content (HTML allowed)
- `is_correct` (BOOLEAN) - Whether this is the correct answer
- `feedback_html` (TEXT) - Feedback for this answer
- `sort_order` (INTEGER) - Display order
- `value_numeric` (NUMERIC) - Numeric value (for matrix questions)
- `value_text` (TEXT) - Text value
- `meta` (JSONB) - Additional metadata

## Import Process

### Step 1: Import Raw Data

1. **Import Quizzes CSV**

   ```sql
   -- In Supabase Dashboard > SQL Editor
   -- First, clear existing data
   TRUNCATE wp_quizzes_raw;

   -- Import your CSV file via Supabase Dashboard
   -- Table: wp_quizzes_raw
   -- Ensure column mapping matches exactly
   ```

2. **Import Questions CSV**

   ```sql
   TRUNCATE wp_questions_raw;
   -- Import questions CSV
   ```

3. **Import Answers CSV**
   ```sql
   TRUNCATE wp_answers_raw;
   -- Import answers CSV
   ```

### Step 2: Create Legacy ID Mappings

```sql
-- Create mapping tables
SELECT create_legacy_mapping();

-- Manually populate course mappings
INSERT INTO legacy_course_mapping (legacy_id, new_id)
SELECT 'your_legacy_course_id', 'your_new_course_uuid';

-- Manually populate lesson mappings
INSERT INTO legacy_lesson_mapping (legacy_id, new_id)
SELECT 'your_legacy_lesson_id', 'your_new_lesson_uuid';
```

### Step 3: Transform Data

```sql
-- Run the complete transformation
CALL transform_all_quiz_data();
```

### Step 4: Update References

```sql
-- Update quiz references with mapped IDs
SELECT update_quiz_references();
```

### Step 5: Validate Data

```sql
-- Check for data integrity issues
SELECT * FROM validate_quiz_integrity();
```

## Post-Import Verification

### 1. Data Counts

```sql
-- Verify counts match expectations
SELECT
  (SELECT COUNT(*) FROM wp_quizzes_raw) as raw_quizzes,
  (SELECT COUNT(*) FROM enhanced_quizzes) as transformed_quizzes,
  (SELECT COUNT(*) FROM wp_questions_raw) as raw_questions,
  (SELECT COUNT(*) FROM quiz_questions) as transformed_questions,
  (SELECT COUNT(*) FROM wp_answers_raw) as raw_answers,
  (SELECT COUNT(*) FROM quiz_answers) as transformed_answers;
```

### 2. Quiz Structure Validation

```sql
-- Check quiz-question-answer relationships
SELECT
  eq.title as quiz_title,
  COUNT(DISTINCT qq.id) as question_count,
  COUNT(DISTINCT qa.id) as answer_count
FROM enhanced_quizzes eq
LEFT JOIN quiz_questions qq ON qq.quiz_id = eq.id
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
GROUP BY eq.id, eq.title
ORDER BY eq.title;
```

### 3. Question Type Distribution

```sql
-- Verify question types are properly normalized
SELECT
  type,
  COUNT(*) as count
FROM quiz_questions
GROUP BY type
ORDER BY count DESC;
```

### 4. Correct Answer Validation

```sql
-- Ensure questions have correct answers (except free_text)
SELECT
  qq.id,
  qq.question_html,
  qq.type,
  COUNT(qa.id) as answer_count,
  COUNT(CASE WHEN qa.is_correct THEN 1 END) as correct_answers
FROM quiz_questions qq
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
WHERE qq.type != 'free_text'
GROUP BY qq.id, qq.question_html, qq.type
HAVING COUNT(CASE WHEN qa.is_correct THEN 1 END) = 0;
```

## Common Issues and Solutions

### Issue 1: Missing Course/Lesson Mappings

**Symptoms**: Quizzes show NULL course_id or lesson_id
**Solution**:

```sql
-- Check unmapped quizzes
SELECT * FROM enhanced_quizzes WHERE course_id IS NULL AND lesson_id IS NULL;

-- Add missing mappings to legacy_course_mapping or legacy_lesson_mapping
-- Then run: SELECT update_quiz_references();
```

### Issue 2: Questions Without Answers

**Symptoms**: Questions exist but no answers are imported
**Solution**:

```sql
-- Check for orphaned questions
SELECT qq.* FROM quiz_questions qq
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
WHERE qa.id IS NULL AND qq.type != 'free_text';
```

### Issue 3: Incorrect Question Types

**Symptoms**: Question types don't match expected values
**Solution**:

```sql
-- Check question type normalization
SELECT DISTINCT type FROM quiz_questions;

-- If needed, manually update types
UPDATE quiz_questions SET type = 'single' WHERE type = 'unknown_type';
```

### Issue 4: Missing Correct Answers

**Symptoms**: Questions have answers but no correct answer marked
**Solution**:

```sql
-- Find questions without correct answers
SELECT qq.id, qq.question_html, qq.type
FROM quiz_questions qq
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id AND qa.is_correct = TRUE
WHERE qa.id IS NULL AND qq.type != 'free_text';

-- Manually mark correct answers
UPDATE quiz_answers SET is_correct = TRUE WHERE id = 'answer_uuid';
```

## Testing the Import

### 1. Test Quiz Display

```sql
-- Test quiz details view
SELECT * FROM quiz_details LIMIT 5;
```

### 2. Test Question Retrieval

```sql
-- Test getting questions for a quiz
SELECT
  qq.question_html,
  qq.type,
  qq.points,
  COUNT(qa.id) as answer_count
FROM quiz_questions qq
LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
WHERE qq.quiz_id = 'your_quiz_uuid'
GROUP BY qq.id, qq.question_html, qq.type, qq.points;
```

### 3. Test Answer Retrieval

```sql
-- Test getting answers for a question
SELECT
  qa.answer_html,
  qa.is_correct,
  qa.feedback_html
FROM quiz_answers qa
WHERE qa.question_id = 'your_question_uuid'
ORDER BY qa.sort_order;
```

## Cleanup

After successful import and verification:

```sql
-- Optional: Remove staging tables (keep for backup)
-- DROP TABLE wp_quizzes_raw;
-- DROP TABLE wp_questions_raw;
-- DROP TABLE wp_answers_raw;
```

## Next Steps

1. **Update Frontend**: Modify quiz components to use new schema
2. **Test Quiz Functionality**: Ensure quizzes work with new structure
3. **Implement Rewards**: Use the new rewards system for XP tracking
4. **Migrate Existing Attempts**: If needed, migrate existing quiz attempts

## Support Functions

### Get Quiz with Questions and Answers

```sql
-- Complete quiz data for frontend
SELECT
  eq.*,
  json_agg(
    json_build_object(
      'id', qq.id,
      'type', qq.type,
      'question_html', qq.question_html,
      'explanation_html', qq.explanation_html,
      'points', qq.points,
      'answers', (
        SELECT json_agg(
          json_build_object(
            'id', qa.id,
            'answer_html', qa.answer_html,
            'is_correct', qa.is_correct,
            'feedback_html', qa.feedback_html
          )
        )
        FROM quiz_answers qa
        WHERE qa.question_id = qq.id
        ORDER BY qa.sort_order
      )
    )
  ) as questions
FROM enhanced_quizzes eq
LEFT JOIN quiz_questions qq ON qq.quiz_id = eq.id
WHERE eq.id = 'your_quiz_uuid'
GROUP BY eq.id;
```

### Award XP for Quiz Completion

```sql
-- Award XP when user completes a quiz
SELECT award_quiz_xp(
  'user_uuid'::uuid,
  'quiz_uuid'::uuid,
  10, -- XP amount
  'Quiz completion bonus'
);
```

### Get User Total XP

```sql
-- Get total XP for a user
SELECT get_user_total_xp('user_uuid'::uuid);
```
