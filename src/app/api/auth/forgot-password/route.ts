import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

interface ForgotPasswordRequest {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Forgot Password API] Starting forgot password process')

    // Validate request body
    let body: ForgotPasswordRequest
    try {
      body = (await request.json()) as ForgotPasswordRequest
    } catch (parseError) {
      console.error(
        '[Forgot Password API] Failed to parse request body:',
        parseError
      )
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!body.email) {
      console.error('[Forgot Password API] Missing email')
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(body.email)) {
      console.error('[Forgot Password API] Invalid email format')
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Dynamically determine the base URL so we always send a correct redirect no matter where we are (local, preview, prod)
    const reqUrl = new URL(request.url)
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`
    const redirectUrl = `${baseUrl}/auth/password-reset`

    console.log(
      '[Forgot Password API] Sending password reset email to:',
      body.email
    )
    console.log('[Forgot Password API] Using redirect URL:', redirectUrl)
    console.log(
      '[Forgot Password API] Base URL from env:',
      process.env.NEXT_PUBLIC_BASE_URL
    )

    // Send password reset email with redirect to our reset page
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('[Forgot Password API] Supabase error:', error)

      // Don't reveal if the email exists or not for security reasons
      // Always return success to prevent email enumeration attacks
      return NextResponse.json({
        success: true,
        message:
          'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
      })
    }

    console.log('[Forgot Password API] Password reset email sent successfully')

    return NextResponse.json({
      success: true,
      message:
        'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
    })
  } catch (error) {
    console.error('[Forgot Password API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
