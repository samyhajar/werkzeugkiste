// Script to upload default certificate template to storage
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function uploadDefaultTemplate() {
  try {
    console.log('Uploading default certificate template...')

    // Check if the template file exists
    const templatePath = path.join(
      process.cwd(),
      'public',
      'zertifikat-leer-3.jpg'
    )

    if (!fs.existsSync(templatePath)) {
      console.error('Template file not found at:', templatePath)
      console.log(
        'Please ensure the template file exists in the public directory'
      )
      return
    }

    console.log('Found template file:', templatePath)

    // Read the template file
    const fileBuffer = fs.readFileSync(templatePath)
    console.log('File size:', fileBuffer.length, 'bytes')

    // Upload to certificates bucket in templates folder
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload('templates/zertifikat-leer-3.jpg', fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return
    }

    console.log('Template uploaded successfully!')
    console.log('Path:', data.path)
    console.log('ID:', data.id)

    // List templates to verify
    const { data: templates, error: listError } = await supabase.storage
      .from('certificates')
      .list('templates', {
        limit: 100,
        offset: 0,
      })

    if (listError) {
      console.error('Error listing templates:', listError)
    } else {
      console.log('\nAvailable templates:')
      if (templates && templates.length > 0) {
        templates.forEach((template, index) => {
          console.log(`${index + 1}. ${template.name}`)
          console.log(`   Size: ${template.metadata?.size || 0} bytes`)
          console.log(`   Updated: ${template.updated_at}`)
        })
      } else {
        console.log('No templates found.')
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

uploadDefaultTemplate()
