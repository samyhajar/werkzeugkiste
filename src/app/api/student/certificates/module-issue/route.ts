import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: false, // Allow client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                path: '/',
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

export async function POST(req: NextRequest) {
  const { module_id } = await req.json()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('check_module_completion', {
    p_student_id: user.id,
    p_module_id: module_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data) {
    const { error: insertError } = await supabase.from('certificates').insert({
      user_id: user.id,
      module_id: module_id,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Certificate issued successfully' })
  } else {
    return NextResponse.json(
      { message: 'Module not completed' },
      { status: 400 }
    )
  }
}
