'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email) {
      setError('E-Mail-Adresse ist erforderlich.')
      return
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setEmail('')

        // Redirect back to home page after 3 seconds
        setTimeout(() => {
          router.push('/?forgot-password=sent')
        }, 3000)
      } else {
        setError(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (error) {
      console.error('[ForgotPassword] Error sending email:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-32 p-4" style={{ backgroundColor: '#486682' }}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Logo-digi-CMYK.png"
              alt="Werkzeugkiste Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort vergessen?</h2>
          <p className="text-sm text-gray-600">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200" role="alert">
            {success}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#486682] focus:border-[#486682] sm:text-sm"
              placeholder="ihre@email.com"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#486682] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#3e5570]"
            style={{
              backgroundColor: loading ? '#9ca3af' : '#486682'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>E-Mail wird gesendet...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>E-Mail senden</span>
              </div>
            )}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[#486682] hover:text-[#3e5570] transition-colors font-medium"
            disabled={loading}
          >
            Zurück zur Startseite
          </button>

          <div className="text-xs text-gray-500">
            Erinnern Sie sich an Ihr Passwort?{' '}
            <button
              onClick={() => router.push('/?login=true')}
              className="text-[#486682] hover:text-[#3e5570] font-medium transition-colors"
              disabled={loading}
            >
              Hier anmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}