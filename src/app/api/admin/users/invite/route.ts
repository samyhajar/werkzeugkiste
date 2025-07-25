import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize the Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
  console.log('Received request to invite user.')

  try {
    const { email, role } = await req.json()
    console.log(
      `Attempting to invite user with email: ${email} and role: ${role}`
    )

    if (!email) {
      console.error('Invite failed: Email is required.')
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/set-password`
    console.log(`Redirect URL for invitation is: ${redirectTo}`)

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: redirectTo,
        data: { role: role || 'student' }, // Pass role in metadata
      }
    )

    if (error) {
      console.error('Error inviting user via Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Supabase invitation call successful. Response data:', data)
    // The user object is returned, but we will also need to set the role in our custom `profiles` table.
    // This is a common pattern. The role from the invitation will be available when the user signs up.
    // We can use a trigger on the `auth.users` table to populate the `profiles` table.

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      user: data.user,
    })
  } catch (error) {
    console.error(
      'An unexpected error occurred in the invite user API route:',
      error
    )
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
