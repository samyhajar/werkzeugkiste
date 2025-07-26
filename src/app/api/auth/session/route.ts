import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    console.log('[Session API] Setting session cookies after password update')
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { success: false, error: 'Missing session tokens' },
        { status: 400 }
      )
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Session cookies set successfully',
    })

    // Set the session cookies with proper configuration
    console.log('[Session API] Setting session cookies')
    response.cookies.set('sb-access-token', access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('[Session API] Session cookies set successfully')
    return response
  } catch (error) {
    console.error('[Session API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set session' },
      { status: 500 }
    )
  }
}
