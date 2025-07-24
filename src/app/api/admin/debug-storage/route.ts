import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const testPath = searchParams.get('path')

    if (!testPath) {
      return NextResponse.json(
        { success: false, error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Test 1: List files in certificates bucket
    const { data: files, error: listError } = await supabase.storage
      .from('certificates')
      .list('certificates', { limit: 100 })

    if (listError) {
      console.error('Error listing files:', listError)
      return NextResponse.json(
        { success: false, error: `Failed to list files: ${listError.message}` },
        { status: 500 }
      )
    }

    // Test 2: Try to create a signed URL for the specific path
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('certificates')
        .createSignedUrl(testPath, 3600)

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create signed URL: ${signedUrlError.message}`,
          files: files || [],
          testPath,
        },
        { status: 500 }
      )
    }

    // Test 3: Try to fetch the file using the signed URL
    let fetchError = null
    let fileExists = false

    if (signedUrlData?.signedUrl) {
      try {
        const response = await fetch(signedUrlData.signedUrl)
        fileExists = response.ok
        if (!response.ok) {
          fetchError = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (error) {
        fetchError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      testPath,
      files: files || [],
      signedUrl: signedUrlData?.signedUrl,
      fileExists,
      fetchError,
    })
  } catch (error) {
    console.error('Debug storage API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
