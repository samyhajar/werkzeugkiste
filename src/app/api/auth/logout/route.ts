import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] Starting logout process')
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout API] Supabase signOut error:', error.message)
    }

    // Clear all cookies
    const response = NextResponse.json({ success: true })

    // Clear all possible Supabase cookie names
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-bdjluwlwxqdgkulkjozj-auth-token',
    ]

    cookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName)
    })

    // Clear any other auth-related cookies
    const allCookies = request.cookies.getAll()
    allCookies.forEach(cookie => {
      if (
        cookie.name.startsWith('sb-') ||
        cookie.name.startsWith('supabase-')
      ) {
        response.cookies.delete(cookie.name)
      }
    })

    console.log('[Logout API] Logout process completed successfully')
    return response
  } catch (error) {
    console.error('[Logout API] Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
