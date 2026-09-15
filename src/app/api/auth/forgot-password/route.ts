import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import {
  registrationEmailSchema,
  registrationError,
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
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: new URL(
        '/auth/callback?type=recovery',
        request.url
      ).toString(),
    })
    if (error && error.code !== 'user_not_found') {
      const mapped = registrationError(error.code)
      return NextResponse.json(
        { success: false, error: mapped.message },
        { status: mapped.status }
      )
    }
    return NextResponse.json(
      {
        success: true,
        message:
          'Falls ein Konto mit dieser E-Mail-Adresse existiert, erhalten Sie eine E-Mail zum Zurücksetzen des Passworts. Bitte prüfen Sie auch den Spam-Ordner.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: registrationError().message },
      { status: 503 }
    )
  }
}
