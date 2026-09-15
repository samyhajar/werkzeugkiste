import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { registrationSchema, registrationError } from '@/lib/auth/registration'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Bitte geben Sie Vorname, Nachname, eine gültige E-Mail-Adresse und ein Passwort mit mindestens 6 Zeichen ein.',
      },
      { status: 400 }
    )
  }
  try {
    const { email, password, first_name, last_name } = parsed.data
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL(
          '/auth/callback?type=signup',
          request.url
        ).toString(),
        data: {
          role: 'student',
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
        },
      },
    })
    if (error) {
      if (
        [
          'user_already_exists',
          'email_exists',
          'email_address_exists',
        ].includes(error.code || '')
      ) {
        return NextResponse.json({ success: true, confirmation_required: true })
      }
      const mapped = registrationError(error.code)
      return NextResponse.json(
        { success: false, error: mapped.message, error_code: error.code },
        { status: mapped.status }
      )
    }
    if (!data.user) {
      return NextResponse.json(
        { success: false, error: registrationError().message },
        { status: 503 }
      )
    }
    // The auth.users trigger creates the profile; the SSR client writes session cookies.
    // Avoid returning obfuscated duplicate-user IDs or copying a previous user's session.
    return NextResponse.json(
      { success: true, confirmation_required: !data.session },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: registrationError().message },
      { status: 503 }
    )
  }
}
