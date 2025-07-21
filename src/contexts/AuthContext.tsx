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

        // Parse cookies to find auth-related ones
        const authCookies = document.cookie
          .split('; ')
          .filter(cookie => cookie.includes('sb-') && cookie.includes('auth-token'))

        console.log('[AuthContext] Auth cookies found:', authCookies.length)

        if (authCookies.length > 0) {
          console.log('[AuthContext] Manually parsing auth cookie...')
          try {
            // Extract and decode the cookie value
            console.log('[AuthContext] Cookie raw value length:', authCookies[0].length)
            const cookieValue = authCookies[0].split('=')[1]
            console.log('[AuthContext] Extracted cookie value length:', cookieValue?.length)
            const decodedValue = decodeURIComponent(cookieValue)
            console.log('[AuthContext] Decoded cookie value length:', decodedValue?.length)

            // Remove 'base64-' prefix if present
            const base64Data = decodedValue.startsWith('base64-')
              ? decodedValue.substring(7)
              : decodedValue
            console.log('[AuthContext] Base64 data length:', base64Data?.length)

            // Decode base64 and parse JSON
            const sessionData = JSON.parse(atob(base64Data))
            console.log('[AuthContext] Successfully parsed session from cookie')
            console.log('[AuthContext] Session data keys:', Object.keys(sessionData))
            console.log('[AuthContext] User data preview:', sessionData.user ? `User ID: ${sessionData.user.id}, Email: ${sessionData.user.email}` : 'No user data')

            // Since setSession() hangs in some environments, set user directly from parsed cookie
            console.log('[AuthContext] Setting user directly from parsed cookie data...')
            console.log('[AuthContext] User from cookie:', sessionData.user?.email)
            console.log('[AuthContext] User object keys:', Object.keys(sessionData.user || {}))

            // Set user immediately from cookie data
            setUser(sessionData.user || null)
            setLoading(false)

            console.log('[AuthContext] ✅ User set successfully from cookie!')

            // Optional: Try to set session in background (don't wait for it)
            supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token
            }).then(({ data: _data, error }) => {
              if (error) {
                console.log('[AuthContext] Background setSession failed:', error.message)
              } else {
                console.log('[AuthContext] Background setSession completed successfully')
              }
            }).catch(error => {
              console.log('[AuthContext] Background setSession failed (but user already set):', error.message)
            })

          } catch (parseError) {
            console.error('[AuthContext] Error parsing cookie:', parseError)
            // Fallback to regular getSession
            console.log('[AuthContext] Falling back to getSession...')
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
          }
        } else {
          console.log('[AuthContext] No auth cookies, trying getSession...')
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)
          setLoading(false)
        }
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

    getInitialSession()

    // Fallback timeout to ensure we don't stay loading forever
    const loadingTimeout = setTimeout(() => {
      console.log('[AuthContext] ⏰ Loading timeout - forcing loading to false')
      setLoading(false)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [supabase])

  const signOut = async () => {
    console.log('[AuthContext] 🚪 Starting logout process...')

    if (typeof window === 'undefined' || !supabase) {
      console.log('[AuthContext] Not in browser environment, skipping logout')
      return
    }

    try {
      // Clear user state immediately (don't wait for signOut)
      console.log('[AuthContext] Clearing user state...')
      setUser(null)
      setLoading(false)

      // Call server-side logout API to clear cookies properly
      console.log('[AuthContext] Calling server logout API...')
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        })

        if (response.ok) {
          console.log('[AuthContext] ✅ Server logout successful')
        } else {
          console.error('[AuthContext] Server logout failed:', response.status)
        }
      } catch (fetchError) {
        console.error('[AuthContext] Server logout request failed:', fetchError)
      }

      // Call Supabase signOut to clear session
      console.log('[AuthContext] Calling supabase.auth.signOut()...')
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] SignOut error (but user state already cleared):', error)
      } else {
        console.log('[AuthContext] ✅ Supabase SignOut successful')
      }

      // Clear any remaining auth cookies manually as backup
      if (typeof document !== 'undefined') {
        console.log('[AuthContext] Clearing auth cookies manually as backup...')
        const authCookies = document.cookie
          .split('; ')
          .filter(cookie => cookie.includes('sb-') && cookie.includes('auth-token'))

        authCookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0]
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        })
      }

      console.log('[AuthContext] 🎉 Logout completed successfully')

    } catch (error) {
      console.error('[AuthContext] Error during logout:', error)
    }
  }

  const value = {
    user,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // During SSR or when no AuthProvider is available, return a default state
    return {
      user: null,
      loading: false,
      signOut: async () => {
        console.warn('signOut called but no AuthProvider available')
      },
    }
  }
  return context
}