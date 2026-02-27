import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

// Add metadata export for Next.js 15
export const dynamic = 'force-dynamic'

function mapSignupErrorMessage(code?: string, fallbackMessage?: string): string {
  switch (code) {
    case 'email_address_invalid':
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    case 'over_email_send_rate_limit':
      return 'Bitte warten Sie kurz, bevor Sie es erneut versuchen.'
    case 'user_already_exists':
    case 'email_exists':
    case 'email_address_exists':
      return 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.'
    case 'weak_password':
      return 'Das Passwort ist zu schwach. Bitte verwenden Sie ein stärkeres Passwort.'
    default: {
      const raw = (fallbackMessage || '').toLowerCase()
      if (raw.includes('already') && raw.includes('registered')) {
        return 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.'
      }
      return fallbackMessage || 'Registrierung fehlgeschlagen.'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Signup API] Starting signup process')
    const supabase = await createClient()

    const body = await request.json()

    // Build name fields
    const firstName: string | undefined = body.first_name?.trim() || undefined
    const lastName: string | undefined = body.last_name?.trim() || undefined
    const fullName: string | undefined = (body.full_name?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim()) || undefined

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          role: body.role || 'student',
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (signUpError) {
      console.error('[Signup API] Signup error:', signUpError)
      const errorCode =
        typeof (signUpError as { code?: unknown }).code === 'string'
          ? ((signUpError as { code?: string }).code as string)
          : undefined
      const errorMessage = mapSignupErrorMessage(errorCode, signUpError.message)

      return NextResponse.json(
        { success: false, error: errorMessage, error_code: errorCode || null },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('[Signup API] No user created')
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Profile rows are created by the DB trigger on auth.users.
    // Avoid manual writes here to prevent RLS issues and ambiguous signup states.

    // Get the session after successful signup
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: body.role || 'student',
      },
    })

    // Set session cookies if session exists
    if (session) {
      console.log('[Signup API] Setting session cookies')
      response.cookies.set('sb-access-token', session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    } else {
      console.log('[Signup API] No session found after signup')
    }

    console.log('[Signup API] Signup successful for:', authData.user.email)
    return response
  } catch (error) {
    console.error('[Signup API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
