import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface LoginBody {
  email: string
  password: string
}

/**
 * POST /api/auth/login
 * ① Signs‑in with Supabase on the **server**
 * ② Writes sb‑access‑token / sb‑refresh‑token cookies via the route’s cookie
 *    store (handled inside createClient)
 * ③ Returns { user, profile }  — no session is needed on the client
 */
export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as LoginBody
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    /* — sign‑in — */
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    /* — fetch lean profile — */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name, created_at')
      .eq('id', data.user.id)
      .single()

    /* cookies were written by createClient → just return JSON */
    return NextResponse.json({ user: data.user, profile }, { status: 200 })
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
