import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

/**
 * POST /api/auth/login
 * ① Signs‑in with Supabase on the **server**
 * ② Writes sb‑access‑token / sb‑refresh‑token cookies via the route's cookie
 *    store (handled inside createClient)
 * ③ Returns { user, profile }  — no session is needed on the client
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = (await request.json()) as {
      email: string
      password: string
    }

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      })

    if (signInError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const userId = authData.user.id
    const userEmail = authData.user.email

    // Fetch the user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        role: profile?.role || 'student',
        full_name: profile?.full_name || '',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
