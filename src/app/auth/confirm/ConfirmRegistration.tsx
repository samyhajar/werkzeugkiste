'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import ResendConfirmationForm from '@/components/shared/ResendConfirmationForm'
import { CONFIRMATION_VALIDITY_TEXT } from '@/lib/auth/registration'

export default function ConfirmRegistration() {
  const [tokenHash, setTokenHash] = useState('')
  const [type, setType] = useState<'email' | 'recovery'>('email')
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The email template puts the token in the fragment: no server logs or referrers.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const query = new URLSearchParams(window.location.search)
    setTokenHash(hash.get('token_hash') || query.get('token_hash') || '')
    setType(
      (hash.get('type') || query.get('type')) === 'recovery'
        ? 'recovery'
        : 'email'
    )
    setReady(true)
  }, [])

  async function confirm() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'Die Bestätigung ist gerade nicht möglich. Bitte versuchen Sie es erneut.'
        )
      } else {
        window.location.replace(data.redirectTo)
      }
    } catch {
      setError('Keine Verbindung. Bitte versuchen Sie es erneut.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#486682] p-4">
      <section className="w-full max-w-lg space-y-6 rounded-xl bg-white p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#486682]">
          {type === 'recovery'
            ? 'Passwort zurücksetzen'
            : 'E-Mail-Adresse bestätigen'}
        </h1>
        {!ready ? (
          <p role="status">Link wird geladen …</p>
        ) : tokenHash ? (
          <>
            <p>
              {type === 'recovery'
                ? 'Öffnen Sie mit dem Button die Seite, auf der Sie ein neues Passwort wählen können.'
                : 'Bestätigen Sie Ihre Registrierung mit einem Klick auf den Button.'}
            </p>
            <p className="text-sm text-gray-700">
              {CONFIRMATION_VALIDITY_TEXT}
            </p>
            <Button
              onClick={confirm}
              disabled={pending}
              className="bg-[#486682] text-white"
            >
              {pending
                ? 'Wird bestätigt …'
                : type === 'recovery'
                  ? 'Neues Passwort wählen'
                  : 'Registrierung bestätigen'}
            </Button>
          </>
        ) : (
          <p>
            Öffnen Sie den Link aus Ihrer Bestätigungs-E-Mail oder fordern Sie
            hier einen neuen an.
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {ready && (!tokenHash || error) && (
          <ResendConfirmationForm kind={type} />
        )}
      </section>
    </div>
  )
}
