import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface LoginBody {
  email: string
  password: string
}

/**
 * POST /api/auth/login  – server‑side sign‑in
 *
 * 1. Verifies credentials with Supabase
 * 2. Writes sb‑access‑token / sb‑refresh‑token cookies via `cookieStore.set`
 * 3. Returns `{ session, user, profile }` as JSON
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

    /* ─── Supabase client tied to this route’s cookie store ─── */
    const supabase = await createClient()

    /* ─── Sign in ─── */
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    /* ─── Fetch lean profile while we’re here ─── */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name, created_at')
      .eq('id', data.user.id)
      .single()

    /* Cookies have already been written to the cookie store via
       `createClient()`; returning any NextResponse will include them. */
    return NextResponse.json(
      { session: data.session, user: data.user, profile },
      { status: 200 }
    )
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
