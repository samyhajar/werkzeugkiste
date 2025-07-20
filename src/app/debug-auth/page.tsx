'use client'

import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { useState } from 'react'

export default function DebugAuth() {
  const auth = useAuth()
  const supabase = getBrowserClient()
  const [testResult, setTestResult] = useState<any>(null)
  const [password, setPassword] = useState('')

  const testProfileQuery = async () => {
    if (!auth.user) {
      setTestResult({ error: 'No user authenticated' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single()

      setTestResult({ data, error })
    } catch (err) {
      setTestResult({ error: err })
    }
  }

  const testSession = async () => {
    try {
      console.log('[DEBUG] Testing session...')
      setTestResult({ message: 'Loading session...' })

      // First, check localStorage directly
      const authTokenKey = Object.keys(localStorage).find(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
      )

      const localStorageInfo = {
        hasAuthToken: !!authTokenKey,
        authTokenKey,
        tokenLength: authTokenKey ? localStorage.getItem(authTokenKey)?.length : 0
      }

      console.log('[DEBUG] LocalStorage check:', localStorageInfo)

      // Now try to get session with shorter timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        clearTimeout(timeoutId)

        console.log('[DEBUG] Session result:', { session: !!session, error })

        if (session) {
          setTestResult({
            localStorageInfo,
            session: {
              user_id: session.user.id,
              email: session.user.email,
              expires_at: session.expires_at,
              access_token_length: session.access_token?.length || 0,
              refresh_token_length: session.refresh_token?.length || 0
            },
            error: null
          })
        } else {
          setTestResult({
            localStorageInfo,
            session: null,
            error: error?.message || 'No session found'
          })
        }
      } catch (sessionError) {
        clearTimeout(timeoutId)
        console.error('[DEBUG] Session fetch error:', sessionError)
        setTestResult({
          localStorageInfo,
          session: null,
          error: sessionError instanceof Error ? sessionError.message : 'Session fetch failed'
        })
      }

    } catch (err) {
      console.error('[DEBUG] Session test error:', err)
      setTestResult({
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
    }
  }

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    setTestResult({ data, error })
  }

  const manualSignIn = async () => {
    if (!password) {
      setTestResult({ error: 'Please enter password first' })
      return
    }

    try {
      console.log('[DEBUG] Manual sign in attempt...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'samy.hajar@gmail.com',
        password: password
      })
      console.log('[DEBUG] Manual sign in result:', { data, error })
      setTestResult({ data, error })
    } catch (err) {
      console.error('[DEBUG] Manual sign in error:', err)
      setTestResult({ error: err })
    }
  }

  const checkStorage = () => {
    const localStorage = window.localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
    const cookies = document.cookie.split('; ').filter(cookie => cookie.startsWith('sb-'))

    setTestResult({
      localStorage: keys.map(key => ({ key, value: localStorage.getItem(key)?.substring(0, 50) + '...' })),
      cookies: cookies.map(cookie => ({ cookie: cookie.substring(0, 50) + '...' }))
    })
  }

  const testDirectAuth = async () => {
    if (!password) {
      setTestResult({ error: 'Please enter password first' })
      return
    }

    try {
      console.log('[DEBUG] Direct auth test...')
      setTestResult({ message: 'Testing direct auth...' })

      // Create a fresh Supabase client for testing
      const { createBrowserClient } = await import('@supabase/ssr')
      const testClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await testClient.auth.signInWithPassword({
        email: 'samy.hajar@gmail.com',
        password: password
      })

      if (error) {
        setTestResult({ error: error.message })
        return
      }

      if (data.user) {
        // Try to fetch profile with this fresh session
        const { data: profile, error: profileError } = await testClient
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        setTestResult({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email
          },
          profile: profile || { error: profileError?.message },
          session_expires: data.session?.expires_at
        })
      }

    } catch (err) {
      console.error('[DEBUG] Direct auth error:', err)
      setTestResult({
        error: err instanceof Error ? err.message : 'Direct auth failed'
      })
    }
  }

  const testProfileDirectly = async () => {
    try {
      console.log('[DEBUG] Testing profile directly...')
      setTestResult({ message: 'Testing profile query...' })

      // Test: Try with the current browser client
      const { data: profileWithRLS, error: rlsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'e7871ed8-cb00-4c0f-a305-dff3ae170629')
        .single()

      console.log('[DEBUG] Profile with RLS:', { profileWithRLS, rlsError })

      setTestResult({
        profileWithRLS: profileWithRLS || { error: rlsError?.message },
        currentUserId: auth.user?.id,
        profileQuery: {
          targetId: 'e7871ed8-cb00-4c0f-a305-dff3ae170629',
          matches: auth.user?.id === 'e7871ed8-cb00-4c0f-a305-dff3ae170629'
        },
        hasSession: !!auth.user,
        loading: auth.loading
      })

    } catch (err) {
      console.error('[DEBUG] Profile test error:', err)
      setTestResult({
        error: err instanceof Error ? err.message : 'Profile test failed'
      })
    }
  }

  const testNetworkConnectivity = async () => {
    try {
      console.log('[DEBUG] Testing network connectivity...')
      setTestResult({ message: 'Testing network...' })

      const baseUrl = 'https://bdjluwlwxqdgkulkjozj.supabase.co'

      // Test 1: Simple fetch to the Supabase health endpoint
      const healthResponse = await fetch(`${baseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json'
        }
      })

      console.log('[DEBUG] Health check response:', healthResponse.status)

      // Test 2: Try a simple table query with fetch
      const profileResponse = await fetch(`${baseUrl}/rest/v1/profiles?id=eq.e7871ed8-cb00-4c0f-a305-dff3ae170629&select=*`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json'
        }
      })

      const profileData = await profileResponse.text()
      console.log('[DEBUG] Profile fetch response:', profileResponse.status, profileData)

      setTestResult({
        healthCheck: {
          status: healthResponse.status,
          ok: healthResponse.ok
        },
        profileFetch: {
          status: profileResponse.status,
          ok: profileResponse.ok,
          data: profileData
        },
        networkWorking: healthResponse.ok
      })

    } catch (err) {
      console.error('[DEBUG] Network test error:', err)
      setTestResult({
        networkError: err instanceof Error ? err.message : 'Network test failed',
        possibleIssues: [
          'Network connectivity problem',
          'Supabase service unavailable',
          'CORS issues',
          'Firewall blocking requests'
        ]
      })
    }
  }

  const forceRefreshAuth = async () => {
    try {
      console.log('[DEBUG] Force refreshing auth...')
      setTestResult({ message: 'Force refreshing auth...' })

      // Clear localStorage auth tokens
      const authKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'))
      authKeys.forEach(key => {
        console.log('[DEBUG] Removing localStorage key:', key)
        localStorage.removeItem(key)
      })

      // Force refresh the auth context
      await auth.refreshProfile()

      // Wait a moment and check the new state
      setTimeout(() => {
        setTestResult({
          clearedKeys: authKeys,
          newAuthState: {
            hasUser: !!auth.user,
            hasProfile: !!auth.profile,
            loading: auth.loading
          },
          message: 'Auth state refreshed - try signing in again'
        })
      }, 1000)

    } catch (err) {
      console.error('[DEBUG] Force refresh error:', err)
      setTestResult({
        error: err instanceof Error ? err.message : 'Force refresh failed'
      })
    }
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Auth Context State:</h2>
        <pre className="text-sm mt-2">
          {JSON.stringify({
            hasUser: !!auth.user,
            userId: auth.user?.id,
            hasProfile: !!auth.profile,
            profileId: auth.profile?.id,
            role: auth.role,
            loading: auth.loading
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-bold">Manual Sign In:</h2>
        <div className="flex gap-2 items-center mt-2">
          <span className="text-sm">samy.hajar@gmail.com</span>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
      </div>

      <div className="space-x-2 space-y-2">
        <button
          onClick={testProfileQuery}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Profile Query
        </button>
        <button
          onClick={testSession}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Session
        </button>
        <button
          onClick={refreshSession}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Refresh Session
        </button>
        <button
          onClick={manualSignIn}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Manual Sign In
        </button>
        <button
          onClick={checkStorage}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Check Storage
        </button>
        <button
          onClick={testDirectAuth}
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          Test Direct Auth
        </button>
        <button
          onClick={testProfileDirectly}
          className="bg-teal-500 text-white px-4 py-2 rounded"
        >
          Test Profile Directly
        </button>
        <button
          onClick={testNetworkConnectivity}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Network Connectivity
        </button>
        <button
          onClick={forceRefreshAuth}
          className="bg-teal-500 text-white px-4 py-2 rounded"
        >
          Force Refresh Auth
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Test Result:</h2>
          <pre className="text-sm mt-2 whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="font-bold">Browser Storage Debug:</h2>
        <p className="text-sm">Check your browser's Developer Tools:</p>
        <ol className="text-sm mt-2 list-decimal list-inside">
          <li>Open DevTools (F12)</li>
          <li>Go to Application tab → Local Storage → localhost:3000</li>
          <li>Look for keys starting with "sb-bdjluwlwxqdgkulkjozj-"</li>
          <li>Also check Cookies tab for the same prefix</li>
        </ol>
      </div>
    </div>
  )
}