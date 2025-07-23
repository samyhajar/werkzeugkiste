import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

/**
 * POST /api/auth/login
 * ① Signs‑in with Supabase on the **server**
 * ② Writes sb‑access‑token / sb‑refresh‑token cookies via the route's cookie
 *    store (handled inside createClient)
 * ③ Returns { user, profile }  — no session is needed on the client
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Login API] Starting login process')
    const supabase = await createClient()

    const body = (await request.json()) as {
      email: string
      password: string
    }

    console.log('[Login API] Attempting login for:', body.email)

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

    if (signInError || !authData.user) {
      console.error('[Login API] Login error:', signInError)
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('[Login API] Login successful for:', authData.user.email)

    const userId = authData.user.id
    const userEmail = authData.user.email

    // Fetch the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Login API] Profile fetch error:', profileError)
      // Continue with default values if profile not found
    }

    // Create response with proper cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        role: profile?.role || 'student',
        full_name: profile?.full_name || '',
      },
    })

    // Ensure cookies are properly set for the client
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      console.log('[Login API] Setting session cookies')
      // Set the session cookies
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
      console.error('[Login API] No session found after login')
    }

    console.log('[Login API] Login process completed successfully')
    return response
  } catch (error) {
    console.error('[Login API] Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
