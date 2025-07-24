'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser-client'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default function DebugAuthPage() {
  const { user, session, loading } = useAuth()
  const [serverAuth, setServerAuth] = useState<any>(null)
  const [clientSession, setClientSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])

  useEffect(() => {
    // Check server-side auth
    fetch('/api/auth/test')
      .then(res => res.json())
      .then(data => setServerAuth(data))
      .catch(err => console.error('Server auth check failed:', err))

    // Check client-side session
    const supabase = getBrowserClient()
    supabase.auth.getSession().then(({ data, error }) => {
      setClientSession({ data, error })
    })

    // Check cookies
    setCookies(document.cookie.split(';').map(c => c.trim()))
  }, [])

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AuthContext State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'None'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            <p><strong>Session:</strong> {session ? 'Present' : 'None'}</p>
            {session && (
              <>
                <p><strong>Access Token:</strong> {session.access_token ? 'Present' : 'Missing'}</p>
                <p><strong>Refresh Token:</strong> {session.refresh_token ? 'Present' : 'Missing'}</p>
              </>
            )}
          </div>
        </div>

        {/* Server Auth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Server Auth</h2>
          <div className="space-y-2">
            {serverAuth ? (
              <>
                <p><strong>Authenticated:</strong> {serverAuth.authenticated ? 'Yes' : 'No'}</p>
                {serverAuth.user && (
                  <>
                    <p><strong>Email:</strong> {serverAuth.user.email}</p>
                    <p><strong>Role:</strong> {serverAuth.user.role}</p>
                    <p><strong>Full Name:</strong> {serverAuth.user.full_name}</p>
                  </>
                )}
                {serverAuth.session && (
                  <>
                    <p><strong>Access Token:</strong> {serverAuth.session.access_token}</p>
                    <p><strong>Refresh Token:</strong> {serverAuth.session.refresh_token}</p>
                  </>
                )}
                {serverAuth.error && (
                  <p className="text-red-600"><strong>Error:</strong> {serverAuth.error}</p>
                )}
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>

        {/* Client Session */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Client Session</h2>
          <div className="space-y-2">
            {clientSession ? (
              <>
                {clientSession.error && (
                  <p className="text-red-600"><strong>Error:</strong> {clientSession.error.message}</p>
                )}
                {clientSession.data?.session ? (
                  <>
                    <p><strong>User:</strong> {clientSession.data.session.user.email}</p>
                    <p><strong>Access Token:</strong> {clientSession.data.session.access_token ? 'Present' : 'Missing'}</p>
                    <p><strong>Refresh Token:</strong> {clientSession.data.session.refresh_token ? 'Present' : 'Missing'}</p>
                  </>
                ) : (
                  <p>No session found</p>
                )}
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="space-y-2">
            {cookies.length > 0 ? (
              cookies.map((cookie, index) => (
                <p key={index} className="text-sm break-all">
                  {cookie}
                </p>
              ))
            ) : (
              <p>No cookies found</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={() => fetch('/api/auth/test').then(res => res.json()).then(console.log)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Server Auth
          </button>
          <button
            onClick={() => {
              const supabase = getBrowserClient()
              supabase.auth.getSession().then(console.log)
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Client Session
          </button>
        </div>
      </div>
    </div>
  )
}