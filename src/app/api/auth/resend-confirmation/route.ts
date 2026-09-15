import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  registrationEmailSchema,
  registrationError,
  RESEND_SUCCESS_TEXT,
} from '@/lib/auth/registration'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = registrationEmailSchema.safeParse(body?.email)
  if (!email.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      },
      { status: 400 }
    )
  }

  // Anonymous client: provider-side throttling applies; never use admin/generateLink here.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.data,
      options: {
        emailRedirectTo: new URL(
          '/auth/callback?type=signup',
          request.url
        ).toString(),
      },
    })
    // Avoid revealing whether this address exists or has already been confirmed.
    if (
      error &&
      ![
        'user_not_found',
        'email_not_confirmed',
        'email_already_confirmed',
      ].includes(error.code || '')
    ) {
      const mapped = registrationError(error.code)
      return NextResponse.json(
        { success: false, error: mapped.message },
        { status: mapped.status, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json(
      { success: true, message: RESEND_SUCCESS_TEXT },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: registrationError().message },
      { status: 503 }
    )
  }
}
