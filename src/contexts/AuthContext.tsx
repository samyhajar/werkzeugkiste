'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Only initialize Supabase client in browser
  const supabase = typeof window !== 'undefined' ? getBrowserClient() : null

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined' || !supabase) {
      setLoading(false)
      return
    }

    console.log('[AuthContext] 🚀 Starting AuthContext useEffect...')

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...')

        // Use Supabase's built-in session management
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message)
          setUser(null)
          setLoading(false)
          return
        }

        console.log('[AuthContext] Session found:', session ? `User: ${session.user?.email}` : 'No session')
        setUser(session?.user ?? null)
        setLoading(false)

      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error)
        setUser(null)
        setLoading(false)
      }

      console.log('[AuthContext] getInitialSession completed')
    }

    // Listen for auth changes - this will handle all user state updates
    console.log('[AuthContext] Setting up onAuthStateChange listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] 🔄 Auth state change triggered!')
        console.log('[AuthContext] Event:', event)
        console.log('[AuthContext] Session:', session ? `found for ${session.user?.email}` : 'null/undefined')

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 🚪 SIGNED_OUT event detected - clearing user state')
          setUser(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log(`[AuthContext] ✅ ${event} event - updating user state`)
          setUser(session?.user ?? null)
          setLoading(false)
        } else {
          console.log('[AuthContext] Other auth event, updating user state')
          setUser(session?.user ?? null)
          setLoading(false)
        }

        console.log('[AuthContext] User state updated to:', session?.user?.email || 'null')
      }
    )
    console.log('[AuthContext] onAuthStateChange listener setup complete')

    void getInitialSession()

    // Fallback timeout to ensure we don't stay loading forever
    const loadingTimeout = setTimeout(() => {
      console.log('[AuthContext] ⏰ Loading timeout - forcing loading to false')
      setLoading(false)
    }, 5000)

    return () => {
      console.log('[AuthContext] Cleaning up auth listener and timeout...')
      subscription?.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [supabase])

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out...')

      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('[AuthContext] Sign out error:', error.message)
          throw error
        }
        console.log('[AuthContext] Sign out successful')
      }

      // Clear user state
      setUser(null)
      setLoading(false)

      console.log('[AuthContext] User state cleared')
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error)
      // Still clear user state even if API call fails
      setUser(null)
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}