import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorCode = url.searchParams.get('error_code')
  const errorDescription = url.searchParams.get('error_description')
  const type = url.searchParams.get('type')

  console.log('[Auth Callback] URL params:', {
    code,
    error,
    errorCode,
    errorDescription,
    type,
  })

  // Handle authentication errors
  if (error) {
    console.error('[Auth Callback] Authentication error:', {
      error,
      errorCode,
      errorDescription,
    })
    let redirectPath = '/'

    if (errorCode === 'otp_expired' || error === 'access_denied') {
      // For expired or invalid email links, redirect to login with a specific error
      redirectPath = '/?error=email_link_expired'
    } else {
      redirectPath = `/?error=${error}&error_description=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    }

    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // If no code param, redirect to home page
  if (!code) {
    console.log('[Auth Callback] No code parameter found')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Prepare response that we will attach cookies to (we'll update the redirect path later)
  const response = NextResponse.redirect(new URL('/', request.url))

  // Create Supabase server client with cookie helpers tied to this response
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            console.log('[Auth Callback] Setting cookie:', name)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Exchange the auth code for a session and set cookies
  console.log('[Auth Callback] Exchanging code for session')
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error('[Auth Callback] Session exchange error:', sessionError)
    return NextResponse.redirect(
      new URL(
        `/?error=session_error&error_description=${encodeURIComponent(sessionError.message)}`,
        request.url
      )
    )
  }

  // Determine redirect path based on authentication type
  let redirectPath = '/auth/set-password'

  // Check if this is a password recovery or email confirmation
  if (type === 'recovery') {
    console.log('[Auth Callback] Password recovery flow detected')
    redirectPath = '/auth/set-password'
  } else {
    // For regular login/signup, check user role and redirect appropriately
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log('[Auth Callback] User authenticated:', user.email)

      // Check if user needs to set password (first time login)
      if (user.user_metadata?.needs_password_setup) {
        console.log('[Auth Callback] User needs password setup')
        redirectPath = '/auth/set-password'
      } else {
        // Check user role for redirection
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          redirectPath = '/admin'
        } else {
          redirectPath = '/'
        }
      }
    } else {
      redirectPath = '/'
    }
  }

  console.log('[Auth Callback] Redirecting to:', redirectPath)
  response.headers.set('Location', redirectPath)
  return response
}
