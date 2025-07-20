import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role = 'student' } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== 'student' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid role. Must be student or admin.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Use email prefix as default name
          role: role, // Set role in user metadata
        },
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user) {
      // Also create/update profile record with role
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: email.split('@')[0],
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail the signup if profile creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: data.user,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
