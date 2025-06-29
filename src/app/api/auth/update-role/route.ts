import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface UpdateRoleRequestBody {
  role: 'student' | 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateRoleRequestBody
    const { role } = body

    if (!role || (role !== 'student' && role !== 'admin')) {
      return NextResponse.json(
        { error: 'Valid role (student or admin) is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Update the user's role in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update role error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message: `Role updated to ${role}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
