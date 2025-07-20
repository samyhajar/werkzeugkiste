// Test script to diagnose API issues
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

const testAPIs = async () => {
  console.log('🧪 Testing API endpoints...\n')

  try {
    // Test 1: Check modules table access
    console.log('1️⃣ Testing modules table access (as admin):')
    const { data: modules, error: modulesError } = await adminClient
      .from('modules')
      .select('*')

    if (modulesError) {
      console.error('❌ Modules error:', modulesError)
    } else {
      console.log(`✅ Found ${modules?.length || 0} modules`)
      console.log(
        'Modules:',
        modules?.map(m => ({ id: m.id, title: m.title, status: m.status }))
      )
    }

    // Test 2: Check published modules (as anonymous user)
    console.log('\n2️⃣ Testing published modules access (as anon user):')
    const { data: pubModules, error: pubModulesError } = await anonClient
      .from('modules')
      .select('*')
      .eq('status', 'published')

    if (pubModulesError) {
      console.error('❌ Published modules error:', pubModulesError)
    } else {
      console.log(`✅ Found ${pubModules?.length || 0} published modules`)
    }

    // Test 3: Check lesson_progress table structure
    console.log('\n3️⃣ Testing lesson_progress table structure:')
    const { data: progressData, error: progressError } = await adminClient
      .from('lesson_progress')
      .select('*')
      .limit(5)

    if (progressError) {
      console.error('❌ Progress data error:', progressError)
    } else {
      console.log(`✅ Found ${progressData?.length || 0} progress records`)
      if (progressData?.length > 0) {
        console.log('Sample progress record:', progressData[0])
      }
    }

    // Test 4: Check lessons table
    console.log('\n4️⃣ Testing lessons table access:')
    const { data: lessons, error: lessonsError } = await adminClient
      .from('lessons')
      .select('id, title, course_id')
      .limit(5)

    if (lessonsError) {
      console.error('❌ Lessons error:', lessonsError)
    } else {
      console.log(`✅ Found ${lessons?.length || 0} lessons`)
      if (lessons?.length > 0) {
        console.log('Sample lesson:', lessons[0])
      }
    }

    // Test 5: Test UPSERT operation on lesson_progress (this is what fails)
    console.log('\n5️⃣ Testing lesson_progress UPSERT operation:')

    // Get a test user and lesson
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(1)

    if (profilesError || !profiles?.length) {
      console.error('❌ No student profiles found for testing')
    } else {
      const studentId = profiles[0].id
      console.log('Using student ID:', studentId)

      if (lessons?.length > 0) {
        const lessonId = lessons[0].id
        console.log('Using lesson ID:', lessonId)

        const { error: upsertError } = await anonClient
          .from('lesson_progress')
          .upsert({
            student_id: studentId,
            lesson_id: lessonId,
            completed_at: new Date().toISOString(),
          })

        if (upsertError) {
          console.error(
            '❌ UPSERT error (this is likely the 500 error cause):',
            upsertError
          )
        } else {
          console.log('✅ UPSERT operation successful')
        }
      }
    }
  } catch (error) {
    console.error('💥 Test script error:', error)
  }

  console.log('\n🏁 Test completed')
}

// Run the tests
testAPIs()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  })
