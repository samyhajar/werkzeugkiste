import { createClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

interface SignupRequestBody {
  email: string
  password: string
  fullName?: string
  role?: 'student' | 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupRequestBody
    const { email, password, fullName, role = 'student' } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'User created successfully. Please check your email for verification.',
        user: data.user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
