import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import fs from 'fs'
import path from 'path'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin using profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Read the template file
    const templatePath = path.join(
      process.cwd(),
      'public',
      'zertifikat-leer-3.jpg'
    )

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { success: false, error: 'Template file not found' },
        { status: 404 }
      )
    }

    const fileBuffer = fs.readFileSync(templatePath)

    // Upload to certificates bucket
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload('templates/zertifikat-leer-3.jpg', fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to upload template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template uploaded successfully',
      path: data.path,
    })
  } catch (error) {
    console.error('Error uploading template:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
