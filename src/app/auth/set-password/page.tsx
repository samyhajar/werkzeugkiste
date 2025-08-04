'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { getBrowserClient } from '@/lib/supabase/browser-client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionTokens, setSessionTokens] = useState<{accessToken: string, refreshToken: string} | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkInvitationTokens = async () => {
      try {
        console.log('*** SET_PASSWORD PAGE LOADED *** FULL_URL:', window.location.href)
        console.log('[SetPassword] URL hash:', window.location.hash)
        console.log('[SetPassword] URL search:', window.location.search)

        // Check both hash and query parameters for tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        // Try to get tokens from hash first (usual Supabase format)
        let accessToken = hashParams.get('access_token')
        let refreshToken = hashParams.get('refresh_token')
        let type = hashParams.get('type')

        // If not found in hash, try query parameters
        if (!accessToken || !refreshToken) {
          accessToken = accessToken || queryParams.get('access_token')
          refreshToken = refreshToken || queryParams.get('refresh_token')
          type = type || queryParams.get('type')
        }

        console.log('[SetPassword] Parsed tokens:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length || 0,
          refreshTokenLength: refreshToken?.length || 0
        })

        if (accessToken && refreshToken) {
          console.log('[SetPassword] Valid invitation tokens found')
          setIsValidSession(true)
          setSessionTokens({ accessToken, refreshToken })
        } else {
          console.log('[SetPassword] Missing tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
          })
          setError('Ungültiger Einladungslink. Bitte fordern Sie eine neue Einladung an.')
        }
      } catch (error) {
        console.error('[SetPassword] Error checking tokens:', error)
        setError('Ein Fehler ist aufgetreten beim Verarbeiten des Einladungslinks.')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkInvitationTokens()
  }, [])

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

    if (!sessionTokens) {
      setError('Sitzungstoken fehlen. Bitte verwenden Sie einen neuen Einladungslink.')
      setLoading(false)
      return
    }

    try {
      const supabase = getBrowserClient()

      // Establish session using the tokens from the invitation email
      console.log('*** STEP 1: CALL setSession');
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: sessionTokens.accessToken,
        refresh_token: sessionTokens.refreshToken,
      })
      console.log('*** STEP 1 DONE', { sessionError, gotSession: !!sessionData?.session });

      if (sessionError || !sessionData.session) {
        console.error('[SetPassword] Session establishment error:', sessionError)
        setError('Ungültiger oder abgelaufener Einladungslink. Bitte fordern Sie eine neue Einladung an.')
        setLoading(false)
        return
      }

      console.log('[SetPassword] Session established for password update')

      // Now update the password
      console.log('*** STEP 2: CALL updateUser');
      const { error: updateError } = await supabase.auth.updateUser({ password })
      console.log('*** STEP 2 DONE', { updateError });

      if (updateError) {
        console.error('[SetPassword] Password update error:', updateError)
        setError('Fehler beim Setzen des Passworts: ' + updateError.message)
      } else {
        setSuccess('Passwort erfolgreich gesetzt!')
        console.log('[SetPassword] Password set successfully')

        // Determine redirect based on user role from session
        let redirectPath = '/'
        if (sessionData.session.user?.user_metadata?.role === 'admin') {
          redirectPath = '/admin'
        } else {
          redirectPath = '/'
        }

        console.log('[SetPassword] Redirecting to:', redirectPath)

        // Redirect after success
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000)
      }
    } catch (error) {
      console.error('[SetPassword] Error setting password:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    }

    setLoading(false)
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#486682' }}>
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
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-[#486682] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg text-gray-600">Einladungslink wird überprüft...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#486682' }}>
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
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ungültiger Einladungslink</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#486682] transition-colors hover:bg-[#3e5570]"
              style={{ backgroundColor: '#486682' }}
            >
              Zur Startseite
            </button>
          </div>
        </div>
      </div>
    )
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
            disabled={loading || !isValidSession}
            className="w-full px-4 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#486682] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#3e5570]"
            style={{
              backgroundColor: loading || !isValidSession ? '#9ca3af' : '#486682'
            }}
          >
            {loading ? 'Passwort wird gesetzt...' : 'Passwort festlegen'}
          </button>
        </form>
      </div>
    </div>
  )
}