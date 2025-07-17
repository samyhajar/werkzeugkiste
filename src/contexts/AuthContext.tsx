'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
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
      console.log('[AuthContext] fetchProfile called for userId:', userId)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        console.log('fetchProfile result:', { data, error })

        if (error) {
          console.error('❌ Error fetching profile:', error)
          console.error('❌ Error details:', error.message, error.code)
          return null
        }
        console.log('✅ Fetched profile:', data)
        return data
      } catch (err) {
        console.error('❌ Unexpected error fetching profile:', err)
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

  const signUp = async (
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
      // Create profile row
      await supabase.from('profiles').insert([
        { id: data.user.id, ...metadata }
      ])
    }

    return { error }
  }

  // Simplified signIn - let onAuthStateChange handle state updates
  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called', { email })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('[AuthContext] signInWithPassword result', { error })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Don't manually clear state - let onAuthStateChange handle it
  }

  useEffect(() => {
    const init = async () => {
      console.log('[AuthContext] Initializing...')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('[AuthContext] Initial session:', session)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AuthContext] Fetching profile for initial user:', session.user.id)
        const p = await fetchProfile(session.user.id)
        console.log('[AuthContext] Initial profile fetch result:', p)
        if (p && typeof p === 'object' && 'id' in p) {
          setProfile(p as Profile)
        } else {
          setProfile(null)
        }
      }

      console.log('[AuthContext] Setting loading to false after init')
      setLoading(false)
      console.log('[AuthContext] Initialization complete')
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔁 Auth state change:', event, session?.user?.id)
      console.log('[AuthContext] Current loading state before processing:', loading)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log('[AuthContext] Fetching profile for user:', session.user.id)

        try {
          const p = await fetchProfile(session.user.id)
          console.log('[AuthContext] Profile fetch result:', p)
          if (p && typeof p === 'object' && 'id' in p) {
            setProfile(p as Profile)
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error('[AuthContext] Profile fetch failed:', error)
          setProfile(null)
        }

        console.log('[AuthContext] Setting loading to false after profile fetch')
        setLoading(false)
      } else {
        console.log('[AuthContext] No user, clearing profile and setting loading to false')
        setProfile(null)
        setLoading(false)
      }

      console.log('[AuthContext] Auth state change processing complete')
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

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