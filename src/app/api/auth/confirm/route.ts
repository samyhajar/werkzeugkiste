import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import {
  classifyConfirmationFailure,
  confirmationFailureMessage,
} from '@/lib/auth/registration'

export async function POST(request: NextRequest) {
  // Confirmation changes the session, so reject cross-site submissions.
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json(
      {
        success: false,
        error: 'Bitte öffnen Sie den Bestätigungslink erneut.',
      },
      { status: 403 }
    )
  }
  const body = await request.json().catch(() => null)
  const type = body?.type ?? 'email'
  if (type !== 'email' && type !== 'recovery') {
    return NextResponse.json(
      { success: false, error: 'Der Bestätigungslink ist ungültig.' },
      { status: 400 }
    )
  }
  if (
    typeof body?.token_hash !== 'string' ||
    !/^[a-f0-9]{40,128}$/i.test(body.token_hash)
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Der Bestätigungslink ist unvollständig oder ungültig. Bitte fordern Sie einen neuen Link an.',
      },
      { status: 400 }
    )
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: body.token_hash,
      type,
    })
    if (error || !data.session) {
      const reason = error ? classifyConfirmationFailure(error) : 'unknown'
      const status =
        reason === 'rate_limited' ? 429 : reason === 'unknown' ? 503 : 400
      console.error('[Auth Confirm] Verification failed', {
        requestId: crypto.randomUUID(),
        route: '/api/auth/confirm',
        operation: 'verifyOtp',
        errorCode: error?.code || null,
        errorName: error?.name || null,
        reason,
        status: error?.status || null,
      })
      return NextResponse.json(
        { success: false, error: confirmationFailureMessage(reason), reason },
        { status, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json(
      {
        success: true,
        redirectTo:
          type === 'recovery'
            ? '/auth/password-reset'
            : '/?registration=confirmed',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          'Die Bestätigung ist gerade nicht möglich. Bitte versuchen Sie es erneut.',
      },
      { status: 503 }
    )
  }
}
