'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Utility function to clear auth cookies
const clearAuthCookies = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ]

  cookiesToClear.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
  })

  console.log('[AuthContext] Cleared auth cookies:', cookiesToClear)
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'student'
  first_name: string | null
  created_at: string | null
  updated_at: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: () => boolean
  isStudent: () => boolean
  getUserRole: () => 'admin' | 'student'
  getDisplayName: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const initialized = useRef(false)
  const hasRedirectedOnce = useRef(false) // Track if we've already redirected
  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserClient> | null>(null)
  const router = useRouter()

  // Add visibility change listener to debug tab focus issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AuthContext] Tab became visible - Current state:', {
          hasUser: !!user,
          hasSession: !!session,
          hasProfile: !!profile,
          hasRedirectedOnce: hasRedirectedOnce.current,
          userRole: user?.user_metadata?.role || profile?.role,
          currentPath: window.location.pathname
        })
      } else {
        console.log('[AuthContext] Tab became hidden')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, session, profile])

  const refreshSession = async () => {
    try {
      console.log('[AuthContext] Refreshing session...')
      if (!supabase) {
        console.log('[AuthContext] No supabase client available')
        return
      }

      // First try to get the current session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[AuthContext] Error getting session:', error.message)

        // Handle specific auth errors by clearing state and cookies
        if (error.message.includes('Auth session missing') ||
            error.message.includes('Invalid refresh token') ||
            error.message.includes('refresh_token_not_found')) {
          console.log('[AuthContext] Auth error detected, clearing session state and cookies')

          // Clear state
          setSession(null)
          setUser(null)
          setProfile(null)

          // Clear cookies if in browser
          clearAuthCookies()
        } else {
          // For other errors, just clear the session state
          setSession(null)
          setUser(null)
          setProfile(null)
        }
        return
      }

      console.log('[AuthContext] Session refresh result:', session?.user?.email || 'no session')
      console.log('[AuthContext] User metadata role:', session?.user?.user_metadata?.role)

            if (session) {
        setSession(session)
        setUser(session.user)
        console.log('[AuthContext] Session and user state updated')

        // Check if this is a fresh login (user wasn't previously logged in)
        const wasLoggedOut = !user && !profile

        // Fetch profile when session is established
        await fetchUserProfile(session.user.id)

        console.log('[AuthContext] Profile fetch completed')

        // Handle redirection for fresh logins (when refreshSession is called after login)
        // Only redirect if we haven't redirected before and this is truly a fresh login
        if (wasLoggedOut && !hasRedirectedOnce.current) {
          console.log('[AuthContext] Fresh login detected in refreshSession, handling redirection...')

          // Try to get role from user metadata first
          let userRole = session.user.user_metadata?.role

          if (userRole) {
            console.log('[AuthContext] Found role in metadata (refreshSession):', userRole)
            hasRedirectedOnce.current = true // Mark that we've redirected

            // Immediate redirection - no delay needed
            if (userRole === 'admin') {
              console.log('[AuthContext] Redirecting admin to /admin (refreshSession)')
              router.push('/admin')
            } else {
              console.log('[AuthContext] Redirecting student to / (refreshSession)')
              router.push('/')
            }
          } else {
            console.log('[AuthContext] No role in metadata, checking profile...')
            // Fetch role from profile immediately
            try {
              const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

              const profileRole = data?.role || 'student'
              console.log('[AuthContext] Found role in profile (refreshSession):', profileRole)
              hasRedirectedOnce.current = true // Mark that we've redirected

              if (profileRole === 'admin') {
                console.log('[AuthContext] Redirecting admin to /admin (refreshSession)')
                router.push('/admin')
              } else {
                console.log('[AuthContext] Redirecting student to / (refreshSession)')
                router.push('/')
              }
            } catch (error) {
              console.error('[AuthContext] Error fetching role from profile (refreshSession):', error)
              hasRedirectedOnce.current = true // Mark that we've redirected
              router.push('/')
            }
          }
        } else {
          console.log('[AuthContext] Skipping redirect - wasLoggedOut:', wasLoggedOut, 'hasRedirectedOnce:', hasRedirectedOnce.current)
        }
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('[AuthContext] Exception refreshing session:', error)
      // Clear session state on any exception
      setSession(null)
      setUser(null)
      setProfile(null)
    }
  }

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    if (!supabase) return

    try {
      setProfileLoading(true)
      console.log('[AuthContext] Fetching user profile for:', userId, 'retry:', retryCount)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error)
        console.error('[AuthContext] Error details - code:', error.code, 'message:', error.message, 'details:', error.details)

        // If profile doesn't exist and we haven't retried too many times, wait and retry
        if (error.code === 'PGRST116' && retryCount < 2) { // Reduced from 3 to 2 retries
          console.log('[AuthContext] Profile not found, retrying in 500ms... (attempt', retryCount + 1, 'of 2)')
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1)
          }, 500) // Reduced from 1000ms to 500ms
          return
        }

        // If profile doesn't exist after retries, create a basic one from user metadata
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found after retries, creating immediate fallback profile')
          const userData = user || session?.user
          if (userData) {
            // Create fallback profile immediately
            const defaultProfile: UserProfile = {
              id: userData.id,
              email: userData.email!,
              full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || null,
              role: userData.user_metadata?.role || 'student',
              first_name: userData.user_metadata?.first_name || null,
              created_at: userData.created_at || null,
              updated_at: userData.updated_at || null
            }
            console.log('[AuthContext] Using immediate fallback profile:', defaultProfile)
            setProfile(defaultProfile)

            // Try to create the profile in the database in the background (non-blocking)
            const newProfileData = {
              id: userData.id,
              email: userData.email,
              full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || null,
              role: userData.user_metadata?.role || 'student'
            }

            console.log('[AuthContext] Creating profile in background:', newProfileData)
            supabase
              .from('profiles')
              .insert(newProfileData)
              .select()
              .single()
              .then(({ data: createdProfile, error: createError }: { data: any; error: any }) => {
                if (createError) {
                  console.error('[AuthContext] Background profile creation error:', createError)
                } else {
                  console.log('[AuthContext] Background profile created successfully:', createdProfile)
                  // Update the profile with the database version
                  const profileData: UserProfile = {
                    id: createdProfile.id,
                    email: userData.email || '',
                    full_name: createdProfile.full_name,
                    role: (createdProfile.role as 'admin' | 'student') || 'student',
                    first_name: createdProfile.first_name || null,
                    created_at: createdProfile.created_at,
                    updated_at: createdProfile.updated_at
                  }
                  setProfile(profileData)
                }
              })
          }
        } else {
          // For other errors, try to create a fallback profile
          console.log('[AuthContext] Other profile error, creating fallback profile')
          const userData = user || session?.user
          if (userData) {
            const defaultProfile: UserProfile = {
              id: userData.id,
              email: userData.email!,
              full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || null,
              role: userData.user_metadata?.role || 'student',
              first_name: userData.user_metadata?.first_name || null,
              created_at: userData.created_at || null,
              updated_at: userData.updated_at || null
            }
            console.log('[AuthContext] Using fallback profile for other error:', defaultProfile)
            setProfile(defaultProfile)
          }
        }
        return
      }

      console.log('[AuthContext] Profile fetched successfully:', data.id)
      // Ensure type safety when setting profile
      const profileData: UserProfile = {
        id: data.id,
        email: user?.email || session?.user?.email || data.email || '',
        full_name: data.full_name,
        role: (data.role as 'admin' | 'student') || 'student',
        first_name: data.first_name,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
      setProfile(profileData)
    } catch (error) {
      console.error('[AuthContext] Exception fetching profile:', error)
      console.error('[AuthContext] Exception details:', JSON.stringify(error, null, 2))

      // Create fallback profile even on exceptions
      const userData = user || session?.user
      if (userData) {
        const defaultProfile: UserProfile = {
          id: userData.id,
          email: userData.email!,
          full_name: userData.user_metadata?.full_name || userData.email?.split('@')[0] || null,
          role: userData.user_metadata?.role || 'student',
          first_name: userData.user_metadata?.first_name || null,
          created_at: userData.created_at || null,
          updated_at: userData.updated_at || null
        }
        console.log('[AuthContext] Using fallback profile after exception:', defaultProfile)
        setProfile(defaultProfile)
      }
    } finally {
      // Only set loading to false if this is not a retry
      if (retryCount === 0) {
        setProfileLoading(false)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, 0)
    }
  }

  useEffect(() => {
    // Initialize Supabase client only in browser
    if (typeof window !== 'undefined') {
      try {
        setSupabase(getBrowserClient())
      } catch (error) {
        console.error('[AuthContext] Failed to initialize Supabase client:', error)
      }
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

        // Skip session establishment if on password reset pages to avoid auth confusion
        if (typeof window !== 'undefined' &&
            (window.location.pathname === '/auth/password-reset' ||
             window.location.pathname === '/auth/set-password')) {
          console.log('[AuthContext] On password reset page, skipping initial session establishment')
          setSession(null)
          setUser(null)
          setProfile(null)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[AuthContext] Error getting session:', error.message)

          // Handle specific auth errors by clearing state and cookies
          if (error.message.includes('Auth session missing') ||
              error.message.includes('Invalid refresh token') ||
              error.message.includes('refresh_token_not_found')) {
            console.log('[AuthContext] Initial session auth error detected, clearing session state and cookies')

            // Clear state
            setSession(null)
            setUser(null)
            setProfile(null)

            // Clear cookies if in browser
            clearAuthCookies()
          } else {
            // For other errors, just clear the session state
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        } else {
          console.log('[AuthContext] Initial session result:', session?.user?.email || 'no session')
          if (session) {
            setSession(session)
            setUser(session.user)
            // Fetch profile for initial session
            await fetchUserProfile(session.user.id)
          } else {
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error('[AuthContext] Exception getting session:', error)

        // Clear session state on exception and clear cookies if it's an auth error
        setSession(null)
        setUser(null)
        setProfile(null)

        // If it's an auth-related error, clear cookies
        if (error instanceof Error &&
            (error.message.includes('Auth session missing') ||
             error.message.includes('Invalid refresh token') ||
             error.message.includes('refresh_token_not_found'))) {
          console.log('[AuthContext] Exception contains auth error, clearing cookies')

          clearAuthCookies()
        }
      } finally {
        setLoading(false)
      }
    }

    void getInitialSession()

    // Set up auth state change listener
    console.log('[AuthContext] Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('*** AUTH_CONTEXT EVENT ***', event, 'PATH:', typeof window !== 'undefined' ? window.location.pathname : 'server', 'USER:', session?.user?.email)
        console.log('[AuthContext] Auth state change - User role:', session?.user?.user_metadata?.role)

        try {
          if (event === 'SIGNED_OUT') {
            console.log('[AuthContext] SIGNED_OUT event received')
            setUser(null)
            setSession(null)
            setProfile(null)
            hasRedirectedOnce.current = false // Reset redirect flag on logout
            // Let the application handle navigation naturally - no forced redirect needed
            console.log('[AuthContext] SIGNED_OUT - state cleared, letting app handle navigation')
          } else if (event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
            console.log('*** SKIP_AUTH_EVENT ***', event, 'ON PATH', typeof window !== 'undefined' ? window.location.pathname : 'server', '- skipping state updates during password reset flow')
            // Do nothing - password reset page will handle session using tokens explicitly
            return;
          } else if (event === 'SIGNED_IN' && session) {
            // Prevent redirecting away from password reset related pages
            if (window.location.pathname === '/auth/set-password' ||
                window.location.pathname === '/auth/password-reset') {
              console.log('[AuthContext] On password reset page, skipping redirect and state updates.');
              // Don't set session/user state during password reset to avoid UI confusion
              return;
            }

            // Check if this is a fresh login (user wasn't previously logged in)
            const wasLoggedOut = !user && !profile

            setUser(session.user)
            setSession(session)

            // Only redirect on fresh logins and if we haven't redirected before
            if (wasLoggedOut && !hasRedirectedOnce.current) {
              console.log('[AuthContext] SIGNED_IN event - fresh login detected, checking role for redirection')

              // Try to get role from user metadata first
              let userRole = session.user.user_metadata?.role

              if (userRole) {
                console.log('[AuthContext] Found role in metadata:', userRole)
                hasRedirectedOnce.current = true // Mark that we've redirected

                // Fetch profile in parallel
                fetchUserProfile(session.user.id)

                // Immediate redirection only for fresh logins
                if (userRole === 'admin') {
                  console.log('[AuthContext] Redirecting admin to /admin (fresh login)')
                  router.push('/admin')
                } else {
                  console.log('[AuthContext] Redirecting student to / (fresh login)')
                  router.push('/')
                }
              } else {
                console.log('[AuthContext] No role in metadata, fetching profile first...')
                // If no role in metadata, fetch profile first to get role
                try {
                  const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                  const profileRole = data?.role || 'student'
                  console.log('[AuthContext] Found role in profile:', profileRole)
                  hasRedirectedOnce.current = true // Mark that we've redirected

                  // Now fetch full profile in background
                  fetchUserProfile(session.user.id)

                  // Immediate redirection only for fresh logins
                  if (profileRole === 'admin') {
                    console.log('[AuthContext] Redirecting admin to /admin (fresh login)')
                    router.push('/admin')
                  } else {
                    console.log('[AuthContext] Redirecting student to / (fresh login)')
                    router.push('/')
                  }
                } catch (error) {
                  console.error('[AuthContext] Error fetching role from profile:', error)
                  hasRedirectedOnce.current = true // Mark that we've redirected
                  // Default to student and redirect to home
                  fetchUserProfile(session.user.id)
                  router.push('/')
                }
              }
            } else {
              console.log('[AuthContext] SIGNED_IN event - skipping redirect. wasLoggedOut:', wasLoggedOut, 'hasRedirectedOnce:', hasRedirectedOnce.current)
              // Just fetch profile for existing sessions, no redirect
              fetchUserProfile(session.user.id)
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('[AuthContext] TOKEN_REFRESHED event received - no redirect needed')
            console.log('[AuthContext] TOKEN_REFRESHED - User:', session.user.email, 'Role:', session.user.user_metadata?.role)
            setUser(session.user)
            setSession(session)
            // Don't redirect on token refresh, just update the session
          } else {
            console.log('[AuthContext] Other auth event:', event, 'Session user:', session?.user?.email)
            setUser(session?.user ?? null)
            setSession(session)
            if (session?.user) {
              await fetchUserProfile(session.user.id)
            } else {
              setProfile(null)
            }
          }
        } catch (error) {
          console.error('[AuthContext] Error in auth state change handler:', error)
          // On error, clear the session to prevent stuck states
          if (error instanceof Error &&
              (error.message.includes('Auth session missing') ||
               error.message.includes('Invalid refresh token') ||
               error.message.includes('refresh_token_not_found'))) {
            console.log('[AuthContext] Auth error in state change, clearing session')
            setSession(null)
            setUser(null)
            setProfile(null)
          }
        } finally {
          setLoading(false)
        }
      }
    )

    // Set a timeout to force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      console.log('[AuthContext] Timeout reached - forcing loading to false')
      setLoading(false)
    }, 3000) // Reduced from 5 seconds to 3 seconds

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase, router])

  // Add additional timeout for profile loading
  useEffect(() => {
    if (profileLoading) {
      const profileTimeout = setTimeout(() => {
        console.log('[AuthContext] Profile loading timeout - forcing profileLoading to false')
        setProfileLoading(false)
      }, 5000)

      return () => clearTimeout(profileTimeout)
    }
  }, [profileLoading])

    const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out process...')

      // Clear local state first to prevent any UI flicker
      console.log('[AuthContext] Clearing local state...')
      setUser(null)
      setSession(null)
      setProfile(null)
      hasRedirectedOnce.current = false // Reset redirect flag

      // Just force page refresh immediately - let the server handle the rest
      console.log('[AuthContext] Forcing immediate page refresh and redirect...')

      // Use sendBeacon for reliable logout API call that won't be interrupted by navigation
      if (navigator.sendBeacon) {
        // sendBeacon is perfect for this - it's designed to send data when page is unloading
        const logoutData = new FormData()
        logoutData.append('action', 'logout')
        navigator.sendBeacon('/api/auth/logout', logoutData)
      } else {
        // Fallback for older browsers - try normal fetch but don't wait
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        }).catch(error => {
          // This error is expected and non-blocking since we're navigating away
          console.log('[AuthContext] Logout API call interrupted by navigation (expected)')
        })
      }

      // Use a temporary logout redirect to avoid middleware race condition
      // Add a logout parameter so middleware knows this is a logout redirect
      window.location.href = '/?logout=true'

      console.log('[AuthContext] Sign out completed')
    } catch (error) {
      console.error('[AuthContext] Error during sign out:', error)
      // Force redirect even on error
      setUser(null)
      setSession(null)
      setProfile(null)
      window.location.href = '/?logout=true'
    }
  }

  // Helper functions for role checking
  const isAdmin = () => {
    return profile?.role === 'admin' || user?.user_metadata?.role === 'admin'
  }

  const isStudent = () => {
    return profile?.role === 'student' || user?.user_metadata?.role === 'student' || (!profile?.role && !user?.user_metadata?.role)
  }

  const getUserRole = (): 'admin' | 'student' => {
    return profile?.role || user?.user_metadata?.role || 'student'
  }

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      profileLoading,
      signOut,
      refreshSession,
      refreshProfile,
      isAdmin,
      isStudent,
      getUserRole,
      getDisplayName
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.error('useAuth called outside of AuthProvider context')
    // Return a default context instead of throwing to prevent crashes
    return {
      user: null,
      session: null,
      profile: null,
      loading: true,
      profileLoading: false,
      signOut: async () => {
        console.warn('signOut called but AuthProvider context not available')
      },
      refreshSession: async () => {
        console.warn('refreshSession called but AuthProvider context not available')
      },
      refreshProfile: async () => {
        console.warn('refreshProfile called but AuthProvider context not available')
      },
      isAdmin: () => false,
      isStudent: () => true,
      getUserRole: () => 'student' as const,
      getDisplayName: () => 'User'
    }
  }
  return context
}