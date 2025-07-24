import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is authenticated
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

    // Verify the certificate belongs to the user
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('user_id, pdf_url, module_id')
      .eq('pdf_url', fileUrl)
      .eq('user_id', user.id)
      .single()

    if (certError) {
      console.error('Database error:', certError)
      return NextResponse.json(
        { success: false, error: 'Database error while fetching certificate' },
        { status: 500 }
      )
    }

    if (!certificate) {
      console.error(
        'Certificate not found for user:',
        user.id,
        'fileUrl:',
        fileUrl
      )
      return NextResponse.json(
        { success: false, error: 'Certificate not found or access denied' },
        { status: 404 }
      )
    }

    // Get signed URL for the certificate
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from('certificates').createSignedUrl(fileUrl, 3600) // 1 hour

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to access certificate: ${signedUrlError.message}`,
        },
        { status: 500 }
      )
    }

    if (!signedUrlData?.signedUrl) {
      console.error('No signed URL returned for file:', fileUrl)

      // Try to regenerate the certificate if it's missing
      try {
        const regenerateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/admin/regenerate-certificate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              moduleId: certificate.module_id,
            }),
          }
        )

        if (regenerateResponse.ok) {
          // Try to get the signed URL again after regeneration
          const { data: newSignedUrlData, error: newSignedUrlError } =
            await supabase.storage
              .from('certificates')
              .createSignedUrl(fileUrl, 3600)

          if (!newSignedUrlError && newSignedUrlData?.signedUrl) {
            // Continue with the new signed URL
            const response = await fetch(newSignedUrlData.signedUrl)
            if (response.ok) {
              const data = await response.arrayBuffer()
              return new NextResponse(data, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition':
                    'attachment; filename="certificate.pdf"',
                },
              })
            }
          }
        }
      } catch (regenerateError) {
        console.error('Failed to regenerate certificate:', regenerateError)
      }

      return NextResponse.json(
        {
          success: false,
          error:
            'Certificate file not found in storage. Please contact support.',
        },
        { status: 404 }
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
    console.error('Error in student certificate download API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
