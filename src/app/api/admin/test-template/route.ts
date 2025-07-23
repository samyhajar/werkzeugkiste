import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
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

    // List files in certificates bucket
    const { data: files, error: listError } = await supabase.storage
      .from('certificates')
      .list('templates')

    if (listError) {
      console.error('List error:', listError)
      return NextResponse.json(
        { success: false, error: `List error: ${listError.message}` },
        { status: 500 }
      )
    }

    // Try to create signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('certificates')
        .createSignedUrl('templates/zertifikat-leer-3.jpg', 3600)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return NextResponse.json(
        {
          success: false,
          error: `Signed URL error: ${signedUrlError.message}`,
        },
        { status: 500 }
      )
    }

    // Try to fetch the template
    let fetchError = null
    let fetchStatus = null
    try {
      const response = await fetch(signedUrlData.signedUrl)
      fetchStatus = response.status
      if (!response.ok) {
        fetchError = `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      fetchError =
        error instanceof Error ? error.message : 'Unknown fetch error'
    }

    return NextResponse.json({
      success: true,
      files: files || [],
      signedUrl: signedUrlData.signedUrl,
      fetchStatus,
      fetchError,
    })
  } catch (error) {
    console.error('Error in test template API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
