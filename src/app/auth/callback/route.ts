import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // If no code param, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Prepare response that we will attach cookies to
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
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Exchange the auth code for a session and set cookies
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=auth_callback', request.url)
    )
  }

  // Retrieve user profile to decide where to route next
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let redirectPath = '/dashboard'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      redirectPath = '/admin'
    }
  }

  response.headers.set('Location', redirectPath)
  return response
}
