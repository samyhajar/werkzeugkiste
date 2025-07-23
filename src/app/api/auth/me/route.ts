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
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    const userRole = session.user.user_metadata?.role

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: userRole,
        },
        isAdmin: userRole === 'admin',
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
          Vary: 'Cookie',
        },
      }
    )
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }
}
