import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface UnsubscribeRequestBody {
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    const { email }: UnsubscribeRequestBody = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find user id via profiles by email (faster and avoids paging listUsers)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      )
    }

    // If not found in profiles, try admin listUsers as a fallback
    let userId: string | null = profile?.id ?? null

    if (!userId) {
      const { data: usersList, error: listError } =
        await supabase.auth.admin.listUsers()
      if (listError) {
        return NextResponse.json(
          { success: false, error: listError.message },
          { status: 500 }
        )
      }

      const matched = usersList.users?.find(
        u => u.email?.toLowerCase() === email.toLowerCase()
      )
      userId = matched?.id ?? null
    }

    if (!userId) {
      // Respond 200 to avoid revealing which emails exist, but indicate success=false in body
      return NextResponse.json({ success: false, notFound: true })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          marketing_opt_out: true,
          unsubscribed_at: new Date().toISOString(),
        },
      }
    )

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
