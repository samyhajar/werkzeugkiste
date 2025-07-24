// Script to create test certificates
const { createClient } = require('@supabase/supabase-js')

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestCertificates() {
  try {
    console.log('Creating test certificates...')

    // First, let's get a user and some courses
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    if (!users || users.length === 0) {
      console.log('No users found. Please create a user first.')
      return
    }

    const userId = users[0].id
    console.log('Using user ID:', userId)

    // Get some courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(3)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return
    }

    if (!courses || courses.length === 0) {
      console.log('No courses found. Please create courses first.')
      return
    }

    console.log('Found courses:', courses)

    // Create test certificates
    const testCertificates = courses.map(course => ({
      student_id: userId,
      course_id: course.id,
      file_url: null, // We'll generate PDFs later
      issued_at: new Date().toISOString(),
    }))

    console.log('Creating certificates:', testCertificates)

    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .insert(testCertificates)
      .select()

    if (certError) {
      console.error('Error creating certificates:', certError)
      return
    }

    console.log('Successfully created certificates:', certificates)
  } catch (error) {
    console.error('Error:', error)
  }
}

createTestCertificates()
