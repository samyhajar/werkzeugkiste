import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

/**
 * POST /api/auth/login
 * ① Signs‑in with Supabase on the **server**
 * ② Writes sb‑access‑token / sb‑refresh‑token cookies via the route's cookie
 *    store (handled inside createClient)
 * ③ Returns { user, profile }  — no session is needed on the client
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Signed in successfully',
      user: data.user,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
