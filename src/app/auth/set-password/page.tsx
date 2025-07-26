'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          console.log('User signed in, session is ready for password update.');
          setIsSessionReady(true);
        }
      }
    );

    // Initial check in case the user is already signed in when the page loads
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsSessionReady(true);
      }
    };
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess('Passwort erfolgreich aktualisiert!')

      // Get the current session and user to determine their role
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()

      if (session && user) {
        // Make API call to establish server-side session cookies
        try {
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
            credentials: 'include'
          })

          if (response.ok) {
            // Session cookies are now set, determine redirect path
            let redirectPath = '/'
            if (user?.user_metadata?.role === 'admin') {
              redirectPath = '/admin'
            } else {
              // For students or if no role is specified, go to home page
              redirectPath = '/'
            }

            // Redirect after successful session establishment
            setTimeout(() => {
              router.push(redirectPath)
            }, 1000) // Brief delay to show success message
          } else {
            setError('Fehler beim Einrichten der Sitzung. Bitte loggen Sie sich erneut ein.')
          }
        } catch (sessionError) {
          console.error('Session establishment error:', sessionError)
          setError('Fehler beim Einrichten der Sitzung. Bitte loggen Sie sich erneut ein.')
        }
      } else {
        setError('Keine gültige Sitzung gefunden. Bitte loggen Sie sich erneut ein.')
      }
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
            disabled={loading || !isSessionReady}
            className="w-full px-4 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b5169] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#2d3e52]"
            style={{
              backgroundColor: loading || !isSessionReady ? '#9ca3af' : '#3b5169'
            }}
          >
            {loading ? 'Passwort wird gesetzt...' : 'Passwort festlegen'}
          </button>
        </form>

        {!isSessionReady && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#3b5169] rounded-full animate-spin mr-2"></div>
              Session wird vorbereitet...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}