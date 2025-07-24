'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/browser-client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  const refreshSession = async () => {
    try {
      console.log('[AuthContext] Refreshing session...')
      const supabase = getBrowserClient()
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AuthContext] Error refreshing session:', error.message)
        return
      }

      console.log('[AuthContext] Session refresh result:', session?.user?.email || 'no session')
      if (session) {
        setSession(session)
        setUser(session.user)
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('[AuthContext] Exception refreshing session:', error)
    }
  }

  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized.current) {
      return
    }
    initialized.current = true

    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...')
        const supabase = getBrowserClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message)
          return
        }

        console.log('[AuthContext] Initial session result:', session?.user?.email || 'no session')
        if (session) {
          setSession(session)
          setUser(session.user)
        }
      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    void getInitialSession()

    // Set up auth state change listener
    const supabase = getBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email)
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        } else {
          setUser(session?.user ?? null)
          setSession(session)
        }
        setLoading(false)
      }
    )

    // Set a timeout to force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out process...')

      // Call the logout API to clear server-side session
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('[AuthContext] Logout API call failed')
      }

      // Also call Supabase client logout
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] Supabase sign out error:', error.message)
      }

      // Clear local state
      setUser(null)
      setSession(null)

      console.log('[AuthContext] Sign out completed successfully')

      // Add a small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100))

      // Force a page reload to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error)
      // Even if there's an error, clear the local state
      setUser(null)
      setSession(null)

      // Add a small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100))

      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}