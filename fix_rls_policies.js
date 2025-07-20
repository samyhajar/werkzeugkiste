// Fix RLS policies directly using Supabase admin client
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const fixRLSPolicies = async () => {
  console.log('🔧 Fixing RLS policies...')

  try {
    // Add missing UPDATE policy for lesson_progress (needed for UPSERT operations)
    console.log('📝 Adding UPDATE policy for lesson_progress...')
    await supabase
      .rpc('exec_sql', {
        query: `
        DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
        CREATE POLICY "Users can update own progress" ON lesson_progress
          FOR UPDATE USING (student_id = auth.uid())
          WITH CHECK (student_id = auth.uid());
      `,
      })
      .then(({ error }) => {
        if (error) throw error
      })

    // Enable RLS on modules table and add policies
    console.log('🔒 Enabling RLS on modules table...')
    await supabase
      .rpc('exec_sql', {
        query: `
        ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
      `,
      })
      .then(({ error }) => {
        if (error) throw error
      })

    console.log('📋 Adding modules RLS policies...')
    await supabase
      .rpc('exec_sql', {
        query: `
        DROP POLICY IF EXISTS "Published modules are viewable by all" ON modules;
        CREATE POLICY "Published modules are viewable by all" ON modules
          FOR SELECT USING (status = 'published' OR status IS NULL);

        DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
        CREATE POLICY "Admins can manage modules" ON modules
          FOR ALL USING (
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
          );
      `,
      })
      .then(({ error }) => {
        if (error) throw error
      })

    // Fix quizzes RLS policy to support course-level quizzes
    console.log('🎯 Fixing quizzes RLS policy...')
    await supabase
      .rpc('exec_sql', {
        query: `
        DROP POLICY IF EXISTS "Quizzes viewable if course published" ON quizzes;
        CREATE POLICY "Quizzes viewable if course published" ON quizzes
          FOR SELECT USING (
            -- Course-level quizzes
            (course_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM courses
              WHERE courses.id = quizzes.course_id
              AND courses.status = 'published'
            ))
            OR
            -- Lesson-level quizzes
            (lesson_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM lessons
              JOIN courses ON courses.id = lessons.course_id
              WHERE lessons.id = quizzes.lesson_id
              AND courses.status = 'published'
            ))
          );
      `,
      })
      .then(({ error }) => {
        if (error) throw error
      })

    console.log('✅ RLS policies fixed successfully!')

    // Test the fixes by trying to fetch modules
    console.log('🧪 Testing module fetching...')
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')

    if (modulesError) {
      console.error('❌ Module fetch test failed:', modulesError)
    } else {
      console.log(
        `✅ Module fetch test passed - found ${modules?.length || 0} modules`
      )
    }
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    process.exit(1)
  }
}

// Run the script
fixRLSPolicies()
  .then(() => {
    console.log('🎉 All done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
