import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth check error:', error)
      return NextResponse.json(
        { authenticated: false, error: error.message },
        { status: 401 }
      )
    }

    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: userRole,
      },
      isAdmin: userRole === 'admin',
    })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
