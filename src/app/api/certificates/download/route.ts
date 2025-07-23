import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

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

    // Get signed URL for the certificate
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from('certificates').createSignedUrl(url, 3600) // 1 hour

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Failed to access certificate' },
        { status: 500 }
      )
    }

    // Download the file using the signed URL
    const response = await fetch(signedUrlData.signedUrl)
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to download certificate' },
        { status: 500 }
      )
    }

    const data = await response.arrayBuffer()

    // Return the file as a response
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="certificate.pdf"',
      },
    })
  } catch (error) {
    console.error('Error in certificate download API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
