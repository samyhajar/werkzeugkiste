'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
      ((error === 'session_error' || error === 'server_error') &&
        (normalizedErrorDescription.includes('code verifier') ||
          normalizedErrorDescription.includes('flow state') ||
          normalizedErrorDescription.includes('invalid grant') ||
          normalizedErrorDescription.includes('otp') ||
          normalizedErrorDescription.includes('expired')))

    const shouldHideAuthErrorBanner = normalizedErrorDescription.includes(
      'both auth code and code verifier should be non-empty'
    )

    return {
      code,
      error,
      errorDescription,
      forgotPasswordStatus,
      passwordResetStatus,
      logout,
      isAuthLinkError,
      shouldHideAuthErrorBanner,
    }
  }, [searchParams])

  useEffect(() => {
    if (status.code) {
      router.replace(`/auth/callback?code=${encodeURIComponent(status.code)}`)
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
      {status.error && !status.shouldHideAuthErrorBanner && (
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
                    ? 'E-Mail-Link abgelaufen'
                    : 'Authentifizierungsfehler'}
                </h2>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {status.isAuthLinkError
                      ? 'Der E-Mail-Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an oder melden Sie sich direkt an.'
                      : status.errorDescription ||
                        'Es ist ein Fehler bei der Anmeldung aufgetreten. Versuchen Sie es erneut.'}
                  </p>
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
