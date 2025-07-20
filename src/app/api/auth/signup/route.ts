import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface SignupRequest {
  email: string
  password: string
  fullName: string
}

interface SignupResponse {
  success: boolean
  message?: string
  error?: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SignupResponse>> {
  try {
    const supabase = await createClient()
    const body: SignupRequest = await request.json()

    const { email, password, fullName } = body

    // Basic validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract first name from full name
    const firstName = fullName.split(' ')[0] || 'User'

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          role: 'student',
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { success: false, error: signUpError.message },
        { status: 400 }
      )
    }

    if (authData.user) {
      // Create profile entry
      const profileFirstName = fullName.split(' ')[0] || 'User'
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        first_name: profileFirstName,
        role: 'student',
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway as the user was created successfully
      }
    }

    return NextResponse.json({
      success: true,
      message:
        'Account created successfully. Please check your email to verify your account.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
