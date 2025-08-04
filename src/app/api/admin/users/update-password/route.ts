import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createAdminClient()

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First, find the user by email
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw listError
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: `User with email ${email} not found` },
        { status: 404 }
      )
    }

    // Update the user's password
    const { data: updateData, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, { password })

    if (updateError) {
      throw updateError
    }

    console.log(`[Admin] Password updated for user: ${email}`)

    return NextResponse.json({
      success: true,
      message: `Password successfully updated for ${email}`,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error('[Admin] Error updating password:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
