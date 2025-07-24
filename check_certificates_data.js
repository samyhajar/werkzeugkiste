// Script to check certificates data
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

async function checkCertificatesData() {
  try {
    console.log('Checking certificates data...')

    // Fetch all certificates
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*')
      .order('issued_at', { ascending: false })

    if (error) {
      console.error('Error fetching certificates:', error)
      return
    }

    console.log('Total certificates:', certificates?.length || 0)

    if (certificates && certificates.length > 0) {
      console.log('\nCertificate data:')
      certificates.forEach((cert, index) => {
        console.log(
          `${index + 1}. Student ID: ${cert.student_id} | Course ID: ${cert.course_id} | File URL: ${cert.file_url} | Issued: ${cert.issued_at}`
        )
      })

      // Check for null/undefined values
      const nullStudentIds = certificates.filter(c => !c.student_id)
      const nullCourseIds = certificates.filter(c => !c.course_id)

      console.log('\nCertificates with null student_id:', nullStudentIds.length)
      console.log('Certificates with null course_id:', nullCourseIds.length)

      if (nullStudentIds.length > 0 || nullCourseIds.length > 0) {
        console.log('\nProblematic certificates:')
        certificates.forEach((cert, index) => {
          if (!cert.student_id || !cert.course_id) {
            console.log(
              `${index + 1}. Student ID: ${cert.student_id} | Course ID: ${cert.course_id}`
            )
          }
        })
      }
    } else {
      console.log('No certificates found.')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCertificatesData()
