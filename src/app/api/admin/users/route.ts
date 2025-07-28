import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()

  try {
    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) {
      throw usersError
    }

    const userIds = users.map(user => user.id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .in('id', userIds)

    if (profilesError) {
      throw profilesError
    }

    const profilesMap = new Map(
      profiles.map(p => [p.id, { role: p.role, full_name: p.full_name }])
    )

    const combinedUsers = users.map(user => {
      const profile = profilesMap.get(user.id)

      // Try different metadata field names for the user's name
      let fullName = profile?.full_name
      if (!fullName && user.user_metadata) {
        fullName =
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.user_metadata.display_name
      }

      return {
        id: user.id,
        email: user.email,
        full_name: fullName || null,
        role: profile?.role || 'student',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }
    })

    return NextResponse.json({ success: true, users: combinedUsers })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createAdminClient()

  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Invite the user via auth
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email)

    if (
      inviteError &&
      !inviteError.message.includes('User already registered')
    ) {
      throw inviteError
    }

    // After invite or if user exists, get the user to update their role
    // We need to list users and find the one with the matching email, since the invite might not return the user if they already exist.
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const user = users.find(u => u.email === email)

    if (!user) {
      throw new Error(`Could not find user with email ${email} after invite.`)
    }

    // Set the role in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role: role, email: email }, { onConflict: 'id' })

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({ success: true, user: { ...user, role } })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
