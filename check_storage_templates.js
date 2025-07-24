// Script to check available certificate templates in storage
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

async function checkStorageTemplates() {
  try {
    console.log('Checking certificate templates in storage...')

    // List files in the templates folder
    const { data: templates, error } = await supabase.storage
      .from('certificates')
      .list('templates', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'updated_at', order: 'desc' },
      })

    if (error) {
      console.error('Error listing templates:', error)
      return
    }

    console.log('Available templates:')
    if (templates && templates.length > 0) {
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`)
        console.log(`   ID: ${template.id}`)
        console.log(`   Size: ${template.metadata?.size || 0} bytes`)
        console.log(`   Updated: ${template.updated_at}`)
        console.log('')
      })
    } else {
      console.log('No templates found in storage.')
    }

    // Also check if there are any files in the root of certificates bucket
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('certificates')
      .list('', {
        limit: 100,
        offset: 0,
      })

    if (rootError) {
      console.error('Error listing root files:', rootError)
    } else {
      console.log('Files in root of certificates bucket:')
      if (rootFiles && rootFiles.length > 0) {
        rootFiles.forEach((file, index) => {
          console.log(`${index + 1}. ${file.name}`)
        })
      } else {
        console.log('No files in root of certificates bucket.')
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkStorageTemplates()
