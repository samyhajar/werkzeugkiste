import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(_request: NextRequest) {
  try {
    console.log('[LogoutAPI] Starting server-side logout...')
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[LogoutAPI] SignOut error:', error)
      // Don't return error - we'll still clear cookies manually
    } else {
      console.log('[LogoutAPI] ✅ SignOut successful')
    }

    // Create response and manually clear auth cookies
    const response = NextResponse.json({
      message: 'Logged out successfully',
      success: true,
    })

    // Clear all possible Supabase auth cookies
    const cookiesToClear = [
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1]?.split('.')[0]}-auth-token`,
      'sb-auth-token',
      'supabase-auth-token',
      'sb-access-token',
      'sb-refresh-token',
    ]

    cookiesToClear.forEach(cookieName => {
      // Clear for different path and domain combinations
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    })

    console.log('[LogoutAPI] 🎉 Logout completed, cookies cleared')
    return response
  } catch (error) {
    console.error('[LogoutAPI] Unexpected error:', error)

    // Even if there's an error, return success and try to clear cookies
    const response = NextResponse.json({
      message: 'Logged out (with errors)',
      success: true,
    })

    return response
  }
}
