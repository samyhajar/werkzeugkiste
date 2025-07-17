import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

interface LoginBody {
  email: string
  password: string
}

/**
 * POST /api/auth/login  – server‑side sign‑in
 *
 * 1. Verifies credentials with Supabase
 * 2. Writes sb‑access‑token / sb‑refresh‑token cookies via `response.cookies.set`
 * 3. Returns `{ session, user, profile }` as JSON
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as LoginBody

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    /* ─── Prepare response & Supabase client with cookie helpers ─── */
    const response = new NextResponse(null, { status: 200 })
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies().getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

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

    /* ─── Return session JSON along with cookies ─── */
    return new NextResponse(
      JSON.stringify({ session: data.session, user: data.user, profile }),
      {
        status: 200,
        headers: response.headers,
      }
    )
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
