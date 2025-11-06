import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface LoginRequest {
  email: string
  password: string
}

// Add metadata export for Next.js 15
export const dynamic = 'force-dynamic'

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
    console.log(
      '[Login API] Request headers:',
      Object.fromEntries(request.headers.entries())
    )
    console.log('[Login API] Request URL:', request.url)

    // Validate request body
    let body: LoginRequest
    try {
      body = (await request.json()) as LoginRequest
    } catch (parseError) {
      console.error('[Login API] Failed to parse request body:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!body.email || !body.password) {
      console.error('[Login API] Missing email or password')
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    const profileData = profile as Pick<Profile, 'id' | 'full_name' | 'role'> | null

    if (profileError) {
      console.error('[Login API] Profile fetch error:', profileError)
      // Continue with default values if profile not found
    }

    // Get the session after successful login
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error('[Login API] No session found after login')
      return NextResponse.json(
        { success: false, error: 'Session creation failed' },
        { status: 500 }
      )
    }

    // Create response including session tokens so the client can set the browser session
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        role: profileData?.role || 'student',
        full_name: profileData?.full_name || '',
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    })

    console.log('[Login API] Login process completed successfully')
    return response
  } catch (error) {
    console.error('[Login API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
