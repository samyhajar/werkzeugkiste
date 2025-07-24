import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        { authenticated: false, error: error.message },
        { status: 401 }
      )
    }

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, message: 'No session found' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || 'student',
        full_name: profile?.full_name || '',
      },
      session: {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing',
      },
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
