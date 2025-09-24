"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { unsubscribeByEmail } from '@/services/unsubscribe'

export function UnsubscribeClient({ emailFromUrl }: { emailFromUrl?: string }) {
  const [email, setEmail] = useState<string>(emailFromUrl || '')
  const [loading, setLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>('')
  const statusRef = useRef<HTMLDivElement>(null)

  const canSubmit = useMemo(() => {
    return /.+@.+\..+/.test(email)
  }, [email])

  useEffect(() => {
    if (emailFromUrl && canSubmit) {
      void handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setSuccess(null)
    setMessage('')

    const result = await unsubscribeByEmail(email.trim().toLowerCase())

    if (result.success) {
      setSuccess(true)
      setMessage('Du wurdest erfolgreich von E-Mail-Benachrichtigungen abgemeldet.')
    } else if (result.notFound) {
      setSuccess(true)
      setMessage('Falls diese E-Mail existiert, wurde sie abgemeldet.')
    } else {
      setSuccess(false)
      setMessage(result.error || 'Abmeldung fehlgeschlagen. Bitte später erneut versuchen.')
    }

    setLoading(false)
    // Announce status for screen readers
    statusRef.current?.focus()
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-[--color-brand-primary] mb-4">Abmeldung</h1>
      <p className="text-sm text-gray-600 mb-6">
        Hier kannst du dich von unseren E-Mail-Benachrichtigungen abmelden.
      </p>

      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="mb-4 min-h-6"
      >
        {success === true && (
          <div className="rounded-md bg-green-50 p-3 text-green-800 text-sm">
            {message}
          </div>
        )}
        {success === false && (
          <div className="rounded-md bg-red-50 p-3 text-red-800 text-sm">
            {message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs outline-none focus:border-[--color-brand-primary] focus:ring-[3px] focus:ring-[color:oklch(var(--color-brand-primary)/0.25)]"
            aria-invalid={success === false || !canSubmit}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full h-10 inline-flex items-center justify-center rounded-md bg-[--color-brand-primary] text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[--color-brand-primary-hover]"
          aria-busy={loading}
        >
          {loading ? 'Wird abgemeldet…' : 'Jetzt abmelden'}
        </button>
      </form>
    </div>
  )
}

export default UnsubscribeClient
