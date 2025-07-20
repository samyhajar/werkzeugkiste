// Simple script to fix the RLS policy using raw SQL execution
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Use service role key to bypass RLS and execute admin commands
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const fixRLS = async () => {
  console.log('🔧 Adding missing RLS policies...')

  try {
    // Add missing UPDATE policy for lesson_progress
    console.log('📝 Adding UPDATE policy for lesson_progress...')

    const { error } = await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can update own progress"
      ON lesson_progress
      FOR UPDATE
      USING (student_id = auth.uid())
      WITH CHECK (student_id = auth.uid());
    `

    if (error) {
      console.error('❌ Error adding UPDATE policy:', error)
    } else {
      console.log('✅ UPDATE policy added successfully')
    }

    // Enable RLS on modules table (if not already enabled)
    console.log('🔒 Ensuring RLS is enabled on modules...')
    const { error: rlsError } = await supabase.sql`
      ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
    `

    // Ignore error if RLS is already enabled
    if (rlsError && !rlsError.message?.includes('already exists')) {
      console.error('❌ Error enabling RLS on modules:', rlsError)
    } else {
      console.log('✅ RLS enabled on modules')
    }

    // Add module read policy
    console.log('📋 Adding modules read policy...')
    const { error: modulesPolicyError } = await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Published modules are viewable by all"
      ON modules
      FOR SELECT
      USING (status = 'published' OR status IS NULL);
    `

    if (modulesPolicyError) {
      console.error('❌ Error adding modules policy:', modulesPolicyError)
    } else {
      console.log('✅ Modules read policy added')
    }

    console.log('🎉 RLS policies fixed!')
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    process.exit(1)
  }
}

// Run the fix
fixRLS()
  .then(() => {
    console.log('✅ All done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fix script failed:', error)
    process.exit(1)
  })
