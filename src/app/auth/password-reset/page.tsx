'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { CustomInput } from '@/components/ui/CustomInput'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordResetPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const [userUpdatedReceived, setUserUpdatedReceived] = useState(false)

  useEffect(() => {
    const checkResetTokens = async () => {
      try {
        // Debug: Log the full URL
        console.log('*** PASSWORD_RESET PAGE LOADED *** FULL_URL:', window.location.href)
        console.log('[PasswordReset] URL hash:', window.location.hash)
        console.log('[PasswordReset] URL search:', window.location.search)

        // Check both hash and query parameters for tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        // Try to get tokens from hash first (usual Supabase format)
        let accessToken = hashParams.get('access_token')
        let refreshToken = hashParams.get('refresh_token')
        let type = hashParams.get('type')

        // If not found in hash, try query parameters
        if (!accessToken || !refreshToken || !type) {
          accessToken = accessToken || queryParams.get('access_token')
          refreshToken = refreshToken || queryParams.get('refresh_token')
          type = type || queryParams.get('type')
        }

        console.log('[PasswordReset] Parsed tokens:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length || 0,
          refreshTokenLength: refreshToken?.length || 0
        })

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('[PasswordReset] Valid recovery tokens found')
          setIsValidSession(true)
        } else {
          console.log('[PasswordReset] Missing or invalid tokens:', {
            type,
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
          })

          // More helpful error message
          if (!type) {
            setError('Kein Reset-Link Typ gefunden. Bitte verwenden Sie den Link aus der E-Mail.')
          } else if (type !== 'recovery') {
            setError(`Falscher Link-Typ: ${type}. Erwartet wurde: recovery.`)
          } else {
            setError('Fehlende Authentifizierungs-Tokens. Bitte fordern Sie einen neuen Reset-Link an.')
          }
        }
      } catch (error) {
        console.error('[PasswordReset] Error checking tokens:', error)
        setError('Ein Fehler ist aufgetreten beim Verarbeiten des Reset-Links.')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkResetTokens()
  }, [])

  // Listen for USER_UPDATED event as backup success indicator
  useEffect(() => {
    if (!isValidSession) return

    const supabase = getBrowserClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'USER_UPDATED' && loading) {
        console.log('*** USER_UPDATED EVENT RECEIVED - treating as success')
        setUserUpdatedReceived(true)
        setLoading(false)
        setSuccess('Passwort erfolgreich zurückgesetzt! Sie werden weitergeleitet.')
        
        setTimeout(() => {
          router.push('/?password-reset=success')
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [isValidSession, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setLoading(true)

    // Failsafe: if loading > 10s show timeout error (unless USER_UPDATED already handled it)
    setTimeout(() => {
      if (loading && !userUpdatedReceived) {
        console.log('*** TIMEOUT AFTER 10s – something is stuck');
        setLoading(false);
        setError('Zeitüberschreitung – bitte Seite neu laden und erneut versuchen.');
      }
    }, 10000);

    try {
      const supabase = getBrowserClient()

            // Get tokens from URL (same logic as initial check)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const queryParams = new URLSearchParams(window.location.search)

      let accessToken = hashParams.get('access_token') || queryParams.get('access_token')
      let refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
      let type = hashParams.get('type') || queryParams.get('type')

      console.log('[PasswordReset] Submit - tokens check:', {
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })

      if (!accessToken || !refreshToken || type !== 'recovery') {
        setError('Sitzungstoken fehlen oder sind ungültig. Bitte verwenden Sie einen neuen Reset-Link.')
        setLoading(false)
        return
      }

      // Establish session using the tokens from the password recovery email
      console.log('*** STEP 1: CALL setSession');
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      console.log('*** STEP 1 DONE', { sessionError, gotSession: !!sessionData?.session });

      if (sessionError || !sessionData.session) {
        console.error('[PasswordReset] Session establishment error:', sessionError)
        setError('Ungültiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen an.')
        setLoading(false)
        return
      }

      console.log('[PasswordReset] Session established for password update')

      // Now update the password
      console.log('*** STEP 2: CALL updateUser');
      const { error: updateError } = await supabase.auth.updateUser({ password })
      console.log('*** STEP 2 DONE', { updateError });

      if (updateError) {
        console.error('[PasswordReset] Password update error:', updateError)
        
        // Handle specific "same password" error with better message
        if (updateError.message?.includes('New password should be different from the old password')) {
          setError('Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.')
        } else {
          setError('Fehler beim Aktualisieren des Passworts: ' + updateError.message)
        }
      } else if (!userUpdatedReceived) {
        // Only show success if we haven't already handled it via USER_UPDATED event
        setSuccess('Passwort erfolgreich zurückgesetzt! Sie werden weitergeleitet.')
        console.log('[PasswordReset] Password updated successfully')

        // Redirect to home page after success (user will be logged in)
        setTimeout(() => {
          router.push('/?password-reset=success')
        }, 2000)
      }
    } catch (error) {
      console.error('[PasswordReset] Error updating password:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    }

    // Only set loading to false if USER_UPDATED event hasn't already handled it
    if (!userUpdatedReceived) {
      setLoading(false)
    }
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
              <span className="text-lg text-gray-600">Reset-Link wird überprüft...</span>
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
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ungültiger Link</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort zurücksetzen</h2>
          <p className="text-sm text-gray-600">Geben Sie Ihr neues Passwort ein</p>
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
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#486682] focus:border-[#486682] sm:text-sm"
              placeholder="Mindestens 6 Zeichen"
              disabled={loading}
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
              className="block w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#486682] focus:border-[#486682] sm:text-sm"
              placeholder="Passwort wiederholen"
              disabled={loading}
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
                <span>Passwort wird zurückgesetzt...</span>
              </div>
            ) : (
              'Passwort zurücksetzen'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[#486682] hover:text-[#3e5570] transition-colors font-medium"
            disabled={loading}
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}