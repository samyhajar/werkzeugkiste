'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import type { User, Session } from '@supabase/supabase-js'

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
  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserClient> | null>(null)

  const refreshSession = async () => {
    try {
      console.log('[AuthContext] Refreshing session...')
      if (!supabase) return
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
    // Initialize Supabase client only in browser
    if (typeof window !== 'undefined') {
      setSupabase(getBrowserClient())
    }
  }, [])

  useEffect(() => {
    // Don't proceed if Supabase client is not available
    if (!supabase) return

    // Prevent duplicate initialization
    if (initialized.current) {
      return
    }
    initialized.current = true

    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...')
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
  }, [supabase])

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

      // Clear client-side session
      if (supabase) {
        await supabase.auth.signOut()
      }

      // Clear local state
      setUser(null)
      setSession(null)

      console.log('[AuthContext] Sign out completed')
    } catch (error) {
      console.error('[AuthContext] Error during sign out:', error)
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