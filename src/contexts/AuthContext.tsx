'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { User, Session } from '@supabase/supabase-js'
import { Tables } from '@/types/supabase'

// ---------------------------------------------------------------------------
type Profile = Tables<'profiles'>
export type UserRole = 'admin' | 'student' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole
  loading: boolean
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: Error | null }>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const role: UserRole =
    profile?.role === 'admin' || profile?.role === 'student'
      ? profile.role
      : null

  const fetchProfile = useCallback(
    async (userId: string) => {
      console.log('[AUTH DEBUG] fetchProfile called for userId:', userId)
      try {
        console.log('[AUTH DEBUG] About to query profiles table')
        console.log('[AUTH DEBUG] Supabase client:', supabase)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        console.log('[AUTH DEBUG] fetchProfile result:', { data, error })

        if (error) {
          console.error('[AUTH DEBUG] Error fetching profile:', error)
          console.error('[AUTH DEBUG] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })

          // If profile doesn't exist, try to create one
          if (error.code === 'PGRST116') { // No rows returned
            console.log('[AUTH DEBUG] Profile not found, creating default profile')
            const defaultProfile = {
              id: userId,
              full_name: null,
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([defaultProfile])
              .select()
              .single()

            if (createError) {
              console.error('[AUTH DEBUG] Error creating default profile:', createError)
              return null
            }

            console.log('[AUTH DEBUG] Created default profile:', newProfile)
            return newProfile
          }

          return null
        }
        console.log('[AUTH DEBUG] Successfully fetched profile:', data)
        return data
      } catch (err) {
        console.error('[AUTH DEBUG] Unexpected error fetching profile:', err)
        console.error('[AUTH DEBUG] Error type:', typeof err)
        console.error('[AUTH DEBUG] Error stack:', err instanceof Error ? err.stack : 'No stack')
        return null
      }
    },
    [supabase]
  )

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }, [user, fetchProfile])

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })

    if (!error && data.user) {
      // Create profile row with proper structure
      const profileData = {
        id: data.user.id,
        full_name: metadata?.full_name as string || null,
        role: metadata?.role as string || 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])

      if (profileError) {
        console.error('[AUTH DEBUG] Error creating profile:', profileError)
        // Don't fail the signup if profile creation fails
        // The user can still sign in and we'll create the profile later
      }
    }

    return { error }
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[AUTH DEBUG] signIn called with email:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('[AUTH DEBUG] signIn result:', { error })
    return { error }
  }, [supabase])

  const signOut = useCallback(async () => {
    console.log('[AUTH DEBUG] signOut called')
    await supabase.auth.signOut()
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      console.log('[AUTH DEBUG] AuthContext initializing...')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('[AUTH DEBUG] Initial session:', session)
      console.log('[AUTH DEBUG] Session user:', session?.user)
      console.log('[AUTH DEBUG] Session access token:', session?.access_token ? 'present' : 'missing')

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AUTH DEBUG] Fetching profile for initial user:', session.user.id)
        const p = await fetchProfile(session.user.id)
        console.log('[AUTH DEBUG] Initial profile fetch result:', p)
        if (p && typeof p === 'object' && 'id' in p) {
          setProfile(p as Profile)
        } else {
          setProfile(null)
        }
      } else {
        console.log('[AUTH DEBUG] No session user found')
      }

      console.log('[AUTH DEBUG] Setting loading to false after init')
      setLoading(false)
      console.log('[AUTH DEBUG] Initialization complete')
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH DEBUG] Auth state change:', event, session?.user?.id)
      console.log('[AUTH DEBUG] Auth state change event:', event)
      console.log('[AUTH DEBUG] Auth state change session user:', session?.user)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AUTH DEBUG] Fetching profile for user:', session.user.id)

        try {
          const p = await fetchProfile(session.user.id)
          console.log('[AUTH DEBUG] Profile fetch result:', p)
          if (p && typeof p === 'object' && 'id' in p) {
            setProfile(p as Profile)
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error('[AUTH DEBUG] Profile fetch failed:', error)
          setProfile(null)
        }

        setLoading(false)
      } else {
        console.log('[AUTH DEBUG] No user, clearing profile and setting loading to false')
        setProfile(null)
        setLoading(false)
      }

      console.log('[AUTH DEBUG] Auth state change processing complete')
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Log current state on every render
  console.log('[AUTH DEBUG] Current state:', { user: user?.id, profile: profile?.id, role, loading })

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }), [user, session, profile, role, loading, signUp, signIn, signOut, refreshProfile])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}