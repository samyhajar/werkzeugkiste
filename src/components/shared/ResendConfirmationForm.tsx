'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CONFIRMATION_VALIDITY_TEXT,
  RESEND_SUCCESS_TEXT,
} from '@/lib/auth/registration'

export default function ResendConfirmationForm({
  initialEmail = '',
  kind = 'email',
}: {
  initialEmail?: string
  kind?: 'email' | 'recovery'
}) {
  const id = useId()
  const [email, setEmail] = useState(initialEmail)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(
        kind === 'recovery'
          ? '/api/auth/forgot-password'
          : '/api/auth/resend-confirmation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(
          data.error ||
            'Der Link konnte nicht angefordert werden. Bitte versuchen Sie es später erneut.'
        )
      } else {
        setMessage(
          kind === 'recovery'
            ? 'Falls ein Konto für diese E-Mail-Adresse existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts. Prüfen Sie auch den Spam-Ordner.'
            : RESEND_SUCCESS_TEXT
        )
      }
    } catch {
      setError(
        'Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3 text-sm text-gray-700">
      <p>{CONFIRMATION_VALIDITY_TEXT}</p>
      <p>
        Bitte behalten Sie Ihre ursprüngliche E-Mail-Adresse. Eine erneute
        Registrierung mit einer anderen Adresse ist nicht nötig.
      </p>
      <form onSubmit={resend} className="space-y-3">
        <label htmlFor={id} className="block font-medium">
          E-Mail-Adresse der Registrierung
        </label>
        <Input
          id={id}
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={event => setEmail(event.target.value)}
          disabled={pending}
          aria-describedby={`${id}-status`}
        />
        <Button
          type="submit"
          disabled={pending}
          className="h-auto min-h-10 whitespace-normal bg-[#486682] text-white"
        >
          {pending
            ? 'Link wird angefordert …'
            : kind === 'recovery'
              ? 'Neuen Passwort-Link anfordern'
              : 'Neuen Bestätigungslink anfordern'}
        </Button>
        <div id={`${id}-status`}>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-green-800">
              {message}
            </p>
          )}
        </div>
      </form>
      <p>
        Bereits bestätigt?{' '}
        <Link href="/auth/login" className="underline">
          Jetzt anmelden
        </Link>{' '}
        oder{' '}
        <Link href="/auth/forgot-password" className="underline">
          Passwort zurücksetzen
        </Link>
        .
      </p>
    </div>
  )
}
