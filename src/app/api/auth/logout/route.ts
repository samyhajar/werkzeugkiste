import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Clear all cookies
    const response = NextResponse.json({ success: true })

    // Clear Supabase cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('supabase-auth-token')

    // Clear any other auth-related cookies
    const cookieNames = ['sb-', 'supabase-']
    cookieNames.forEach(prefix => {
      const cookies = request.cookies.getAll()
      cookies.forEach(cookie => {
        if (cookie.name.startsWith(prefix)) {
          response.cookies.delete(cookie.name)
        }
      })
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
