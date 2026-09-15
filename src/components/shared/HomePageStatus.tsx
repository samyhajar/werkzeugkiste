'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ResendConfirmationForm from './ResendConfirmationForm'
import { CONFIRMATION_VALIDITY_TEXT } from '@/lib/auth/registration'

export default function HomePageStatus() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const status = useMemo(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description') || ''
    const forgotPasswordStatus = searchParams.get('forgot-password')
    const passwordResetStatus = searchParams.get('password-reset')
    const logout = searchParams.get('logout')
    const normalizedErrorDescription = errorDescription.toLowerCase()

    const isAuthLinkError =
      error === 'email_link_expired' ||
      error === 'email_link_invalid' ||
      error === 'email_link_session' ||
      ((error === 'session_error' || error === 'server_error') &&
        (normalizedErrorDescription.includes('code verifier') ||
          normalizedErrorDescription.includes('flow state') ||
          normalizedErrorDescription.includes('invalid grant') ||
          normalizedErrorDescription.includes('otp') ||
          normalizedErrorDescription.includes('expired')))


    return {
      code,
      error,
      errorDescription,
      forgotPasswordStatus,
      passwordResetStatus,
      logout,
      isAuthLinkError,
    }
  }, [searchParams])

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    if (fragment.has('error') || fragment.has('error_code')) {
      router.replace('/?error=email_link_invalid')
      return
    }
    if (status.code) {
      const params = new URLSearchParams({ code: status.code })
      if (searchParams.get('type') === 'recovery') params.set('type', 'recovery')
      router.replace(`/auth/callback?${params.toString()}`)
      return
    }

    if (status.logout === 'true') {
      const nextSearchParams = new URLSearchParams(searchParams.toString())
      nextSearchParams.delete('logout')

      const nextUrl = nextSearchParams.toString()
        ? `/?${nextSearchParams.toString()}`
        : '/'

      router.replace(nextUrl)
    }
  }, [router, searchParams, status.code, status.logout])

  if (status.code) {
    return null
  }

  return (
    <>
      {searchParams.get('registration') === 'confirmed' && (
        <section role="status" className="bg-green-50 p-4 text-green-800">Ihre E-Mail-Adresse wurde bestätigt. Sie können die Werkzeugkiste jetzt nutzen.</section>
      )}
      {status.error && (
        <section
          role="alert"
          className="w-full bg-red-50 border-l-4 border-red-400 p-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="text-sm font-medium text-red-800">
                  {status.isAuthLinkError
                    ? 'E-Mail-Link nicht mehr verwendbar'
                    : 'Authentifizierungsfehler'}
                </h2>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {status.isAuthLinkError
                      ? (status.error === 'email_link_session'
                        ? 'Ihre E-Mail wurde möglicherweise bereits bestätigt, aber die Anmeldung konnte in diesem Browser nicht abgeschlossen werden. Bitte melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem Passwort an. Falls die Bestätigung noch aussteht, fordern Sie einen neuen Link an.'
                        : `Der Link ist abgelaufen, bereits verwendet oder ungültig. ${CONFIRMATION_VALIDITY_TEXT} Falls Sie bereits bestätigt haben, können Sie sich direkt anmelden.`)
                      :
                        'Es ist ein Fehler bei der Anmeldung aufgetreten. Versuchen Sie es erneut.'}
                  </p>
                  {status.isAuthLinkError && <div className="mt-4 max-w-lg"><ResendConfirmationForm /></div>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {status.forgotPasswordStatus === 'sent' && (
        <section
          role="status"
          aria-live="polite"
          className="w-full bg-green-50 border-l-4 border-green-400 p-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="text-sm font-medium text-green-800">
                  E-Mail erfolgreich gesendet!
                </h2>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Falls ein Konto mit Ihrer E-Mail-Adresse existiert, wurde
                    eine E-Mail zum Zurücksetzen des Passworts gesendet. Bitte
                    überprüfen Sie auch Ihren Spam-Ordner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {status.passwordResetStatus === 'success' && (
        <section
          role="status"
          aria-live="polite"
          className="w-full bg-green-50 border-l-4 border-green-400 p-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="text-sm font-medium text-green-800">
                  Passwort erfolgreich zurückgesetzt!
                </h2>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Ihr Passwort wurde erfolgreich aktualisiert. Sie sind jetzt
                    angemeldet und können alle Funktionen nutzen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
