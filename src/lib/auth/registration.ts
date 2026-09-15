import { z } from 'zod'

// Keep aligned with Supabase Auth's mailer_otp_exp (currently 86400 seconds).
export const CONFIRMATION_VALIDITY_HOURS = 24
export const CONFIRMATION_VALIDITY_TEXT = `Bestätigungslinks sind ${CONFIRMATION_VALIDITY_HOURS} Stunden gültig und können nur einmal verwendet werden.`
export const RESEND_SUCCESS_TEXT =
  'Falls für diese E-Mail-Adresse eine Bestätigung aussteht, erhalten Sie einen neuen Link. Prüfen Sie auch Ihren Spam-Ordner. Verwenden Sie nur die neueste E-Mail. Ein bereits bestätigtes Konto können Sie direkt anmelden.'

export type ConfirmationFailureReason =
  | 'expired'
  | 'already_used_or_invalid'
  | 'pkce_state_error'
  | 'rate_limited'
  | 'email_delivery_error'
  | 'unknown'

export function classifyConfirmationFailure(
  error?: {
    code?: string | null
    message?: string | null
    name?: string | null
    status?: number
  } | null
): ConfirmationFailureReason {
  const code = (error?.code || '').toLowerCase()
  const detail = `${error?.name || ''} ${error?.message || ''}`.toLowerCase()

  if (code === 'otp_expired') return 'expired'
  if (
    [
      'bad_code_verifier',
      'flow_state_expired',
      'flow_state_not_found',
    ].includes(code)
  )
    return 'pkce_state_error'
  if (
    ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) ||
    error?.status === 429
  )
    return 'rate_limited'
  if (
    [
      'email_address_invalid',
      'email_address_not_authorized',
      'email_provider_disabled',
    ].includes(code)
  )
    return 'email_delivery_error'
  // Older auth-js versions did not consistently expose a structured PKCE code.
  if (
    detail.includes('code verifier') ||
    detail.includes('flow state') ||
    detail.includes('invalid flow') ||
    detail.includes('invalid grant')
  )
    return 'pkce_state_error'
  if (
    ['validation_failed', 'invite_not_found'].includes(code) ||
    detail.includes('invalid token') ||
    detail.includes('already used')
  )
    return 'already_used_or_invalid'
  return 'unknown'
}

export function confirmationFailureMessage(
  reason: ConfirmationFailureReason
): string {
  switch (reason) {
    case 'expired':
      return `Dieser Bestätigungslink ist abgelaufen. ${CONFIRMATION_VALIDITY_TEXT} Fordern Sie einen neuen Bestätigungslink an.`
    case 'already_used_or_invalid':
      return 'Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet. Falls Ihre E-Mail-Adresse noch nicht bestätigt wurde, fordern Sie einen neuen Link an.'
    case 'pkce_state_error':
      return 'Die Bestätigung konnte in diesem Browser nicht abgeschlossen werden. Fordern Sie einen neuen Link an oder melden Sie sich an, falls Ihre E-Mail-Adresse bereits bestätigt wurde.'
    case 'rate_limited':
      return 'Bitte warten Sie einen Moment und versuchen Sie es danach erneut.'
    case 'email_delivery_error':
      return 'Die Bestätigungs-E-Mail konnte nicht zugestellt werden. Prüfen Sie die Adresse oder wenden Sie sich an Ihre Kursbetreuung.'
    default:
      return 'Die Bestätigung ist gerade nicht möglich. Bitte versuchen Sie es erneut.'
  }
}

export const registrationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254)
export const registrationSchema = z.object({
  email: registrationEmailSchema,
  password: z.string().min(6).max(256),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
})

export function registrationError(code?: string) {
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return {
      status: 429,
      message:
        'Zu viele Anfragen. Bitte warten Sie einige Minuten und versuchen Sie es mit derselben E-Mail-Adresse erneut.',
    }
  }
  if (
    code === 'email_address_invalid' ||
    code === 'email_address_not_authorized'
  ) {
    return {
      status: 400,
      message:
        'Die E-Mail konnte nicht zugestellt werden. Prüfen Sie die E-Mail-Adresse oder wenden Sie sich an Ihre Kursbetreuung.',
    }
  }
  if (code === 'weak_password') {
    return {
      status: 400,
      message:
        'Das Passwort ist zu schwach. Bitte verwenden Sie ein stärkeres Passwort.',
    }
  }
  return {
    status: 503,
    message:
      'Die Anfrage konnte gerade nicht verarbeitet werden. Bitte versuchen Sie es später mit derselben E-Mail-Adresse erneut.',
  }
}
