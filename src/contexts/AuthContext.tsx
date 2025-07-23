'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase/browser-client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false)
  const [lastAuthCheck, setLastAuthCheck] = useState(0)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Skip auth context for admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return
    }

    // Prevent duplicate auth checks
    if (authCheckInProgress) {
      return
    }

    // Debounce auth checks
    const now = Date.now()
    if (now - lastAuthCheck < 1000) {
      return
    }

    setAuthCheckInProgress(true)
    setLastAuthCheck(now)

    const getInitialSession = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message)
          return
        }

        if (session) {
          setSession(session)
          setUser(session.user)
        }
      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error)
      } finally {
        setAuthCheckInProgress(false)
      }
    }

    void getInitialSession()

    // Set up auth state change listener
    const supabase = getBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        } else {
          setUser(session?.user ?? null)
          setSession(session)
        }
      }
    )

    // Set a timeout to force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    setLoadingTimeout(timeout)

    return () => {
      subscription.unsubscribe()
      if (timeout) clearTimeout(timeout)
    }
  }, [authCheckInProgress, lastAuthCheck])

  const signOut = async () => {
    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] Sign out error:', error.message)
        return
      }

      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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