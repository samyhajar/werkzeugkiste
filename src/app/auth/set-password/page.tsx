'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser-client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()

  // Session is ready when we have a user and session, and auth is not loading
  const isSessionReady = !authLoading && !!user && !!session

  useEffect(() => {
    console.log('[SetPassword] Auth state:', {
      authLoading,
      hasUser: !!user,
      hasSession: !!session,
      isSessionReady,
      userEmail: user?.email,
      userAgent: navigator.userAgent
    })
  }, [authLoading, user, session, isSessionReady])

  // Add a timeout to show fallback options if session doesn't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isSessionReady && !authLoading) {
        console.log('[SetPassword] Session timeout reached, showing fallback options')
        setShowFallback(true)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [isSessionReady, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setLoading(true)

    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Passwort erfolgreich aktualisiert!')

        // Determine redirect based on user role from AuthContext
        let redirectPath = '/'
        if (user?.user_metadata?.role === 'admin') {
          redirectPath = '/admin'
        } else {
          // For students or if no role is specified, go to home page
          redirectPath = '/'
        }

        console.log('[SetPassword] Password updated successfully, redirecting to:', redirectPath)

        // Redirect immediately after successful password update
        setTimeout(() => {
          router.push(redirectPath)
        }, 1000) // Brief delay to show success message
      }
    } catch (error) {
      console.error('[SetPassword] Error updating password:', error)
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Willkommen</h2>
          <p className="text-sm text-gray-600">Erstellen Sie ein neues Passwort für Ihr Konto</p>
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
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Neues Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3b5169] focus:border-[#3b5169] sm:text-sm"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Passwort bestätigen
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3b5169] focus:border-[#3b5169] sm:text-sm"
              placeholder="Passwort wiederholen"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!isSessionReady && !showFallback)}
            className="w-full px-4 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b5169] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#2d3e52]"
            style={{
              backgroundColor: loading || (!isSessionReady && !showFallback) ? '#9ca3af' : '#3b5169'
            }}
          >
            {loading ? 'Passwort wird gesetzt...' : 'Passwort festlegen'}
          </button>

          {showFallback && !isSessionReady && (
            <div className="text-center">
              <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="font-medium mb-1">Browser-Kompatibilitätsmodus aktiviert</p>
                <p>Sie können trotzdem versuchen, Ihr Passwort zu setzen. Falls es nicht funktioniert, versuchen Sie es mit einem anderen Browser.</p>
              </div>
            </div>
          )}
        </form>

        {!isSessionReady && !showFallback && (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#3b5169] rounded-full animate-spin mr-2"></div>
              {authLoading ? 'Session wird vorbereitet...' : 'Warten auf Anmeldung...'}
            </div>
            {!authLoading && !user && (
              <div className="text-xs text-gray-500">
                Falls das Problem weiterhin besteht, laden Sie die Seite neu oder verwenden Sie einen anderen Browser (Chrome/Safari empfohlen).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}