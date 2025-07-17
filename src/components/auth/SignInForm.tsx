'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignInFormProps {
  onMessage: (msg: string, type?: 'success' | 'error') => void
}

export default function SignInForm({ onMessage }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const { signIn, user, profile, loading: authLoading } = useAuth()

  // Redirect once user & profile are ready
  useEffect(() => {
    console.log('[SignInForm] useEffect redirect check', {
      authLoading,
      user: !!user,
      profile: !!profile,
      userDetails: user ? { id: user.id, email: user.email } : null,
      profileDetails: profile ? { id: profile.id, role: profile.role } : null
    })

    if (!authLoading && user && profile) {
      console.log('[SignInForm] All conditions met for redirect')
      console.log('[SignInForm] User:', { id: user.id, email: user.email })
      console.log('[SignInForm] Profile:', { id: profile.id, role: profile.role })
      console.log('[SignInForm] Redirecting to dashboard')

      // Add a small delay to ensure state is stable
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } else {
      console.log('[SignInForm] Redirect conditions not met:', {
        authLoading: authLoading,
        hasUser: !!user,
        hasProfile: !!profile,
        reason: !authLoading ? 'Auth not loading' : authLoading && 'Auth still loading',
        missingUser: !user,
        missingProfile: !profile
      })
    }
  }, [authLoading, user, profile, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) {
      console.log('[SignInForm] Already submitting, ignoring')
      return
    }

    console.log('[SignInForm] handleSignIn called', { email })
    console.log('[SignInForm] Current auth state before sign in:', {
      authLoading,
      user: !!user,
      profile: !!profile
    })

    setIsSubmitting(true)

    try {
      console.log('[SignInForm] Calling signIn...')
      const { error } = await signIn(email, password)

      if (error) {
        console.error('[SignInForm] Sign in error:', error)
        onMessage(error.message, 'error')
      } else {
        console.log('[SignInForm] Sign in successful, no error returned')
        onMessage('Sign in successful!', 'success')

        // Log current state after successful sign in
        console.log('[SignInForm] State after successful signIn:', {
          authLoading,
          user: !!user,
          profile: !!profile
        })
      }
    } catch (err) {
      console.error('[SignInForm] Unexpected error:', err)
      onMessage('An unexpected error occurred', 'error')
    } finally {
      console.log('[SignInForm] Setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full bg-[#486681] hover:bg-[#3d5970] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>
  )
}