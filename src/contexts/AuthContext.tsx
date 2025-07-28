'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserClient> | null>(null)
  const router = useRouter()

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
        // If there's an error, clear the session state
        setSession(null)
        setUser(null)
        setProfile(null)
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
        if (wasLoggedOut) {
          console.log('[AuthContext] Fresh login detected in refreshSession, handling redirection...')

          // Try to get role from user metadata first
          let userRole = session.user.user_metadata?.role

                    if (userRole) {
            console.log('[AuthContext] Found role in metadata (refreshSession):', userRole)

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

              if (profileRole === 'admin') {
                console.log('[AuthContext] Redirecting admin to /admin (refreshSession)')
                router.push('/admin')
              } else {
                console.log('[AuthContext] Redirecting student to / (refreshSession)')
                router.push('/')
              }
            } catch (error) {
              console.error('[AuthContext] Error fetching role from profile (refreshSession):', error)
              router.push('/')
            }
          }
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
              .then(({ data: createdProfile, error: createError }) => {
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
          // Clear session state on error
          setSession(null)
          setUser(null)
          setProfile(null)
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
        // Clear session state on exception
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    void getInitialSession()

    // Set up auth state change listener
    console.log('[AuthContext] Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email)
        console.log('[AuthContext] Auth state change - User role:', session?.user?.user_metadata?.role)
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] SIGNED_OUT event received')
          setUser(null)
          setSession(null)
          setProfile(null)
          // Force page refresh and redirect to home page after logout
          console.log('[AuthContext] SIGNED_OUT - forcing immediate redirect')
          window.location.href = '/'
                        } else if (event === 'SIGNED_IN' && session) {
          // Prevent redirecting away from the set-password page
          if (window.location.pathname === '/auth/set-password') {
            console.log('[AuthContext] On set-password page, skipping redirect.');
            setSession(session);
            setUser(session.user);
            return;
          }
          setUser(session.user)
          setSession(session)

          // Handle role-based redirection after login
          console.log('[AuthContext] SIGNED_IN event - checking role for redirection')

          // Try to get role from user metadata first
          let userRole = session.user.user_metadata?.role

                    if (userRole) {
            console.log('[AuthContext] Found role in metadata:', userRole)
            // Fetch profile in parallel
            fetchUserProfile(session.user.id)

            // Immediate redirection
            if (userRole === 'admin') {
              console.log('[AuthContext] Redirecting admin to /admin')
              router.push('/admin')
            } else {
              console.log('[AuthContext] Redirecting student to /')
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

                                          // Now fetch full profile in background
              fetchUserProfile(session.user.id)

              // Immediate redirection
              if (profileRole === 'admin') {
                console.log('[AuthContext] Redirecting admin to /admin')
                router.push('/admin')
              } else {
                console.log('[AuthContext] Redirecting student to /')
                router.push('/')
              }
            } catch (error) {
              console.error('[AuthContext] Error fetching role from profile:', error)
              // Default to student and redirect to home
              fetchUserProfile(session.user.id)
              router.push('/')
            }
          }
        } else {
          setUser(session?.user ?? null)
          setSession(session)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setProfile(null)
          }
        }
        setLoading(false)
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

      // Immediate redirect - now the API call won't be interrupted
      window.location.href = '/'

      console.log('[AuthContext] Sign out completed')
    } catch (error) {
      console.error('[AuthContext] Error during sign out:', error)
      // Force redirect even on error
      setUser(null)
      setSession(null)
      setProfile(null)
      window.location.href = '/'
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