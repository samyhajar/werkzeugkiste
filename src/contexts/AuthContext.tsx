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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }
      console.log('✅ Fetched profile:', data)
      return data
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    return { error }
  }


  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called', { email });
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[AuthContext] signInWithPassword result', { data, error });
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
      console.log('[AuthContext] session and user set', { session: data.session, user: data.session.user });
      const fetchedProfile = await fetchProfile(data.session.user.id);
      console.log('[AuthContext] fetchProfile result', { fetchedProfile });
      setProfile(fetchedProfile);
      console.log('[AuthContext] setProfile called', { fetchedProfile });
    }
    setLoading(false);
    if (error) {
      console.error('[AuthContext] signIn error', error);
    }
    return { error };
  }


  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }

      setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔁 Auth state change:', event, session)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        setProfile(null)
      }

      setLoading(false)
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
