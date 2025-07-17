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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { signIn, user, profile, loading: authLoading } = useAuth()

  // Redirect once user & profile are ready
  useEffect(() => {
    console.log('[SignInForm] useEffect redirect check', { authLoading, user, profile })
    if (!authLoading && user && profile) {
      console.log('[SignInForm] Redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [authLoading, user, profile, router])

  useEffect(() => {
    console.log('[SignInForm] loading state changed', { loading, authLoading })
  }, [loading, authLoading])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[SignInForm] handleSignIn called', { email, password })
    setLoading(true)
    console.log('[SignInForm] Submitting sign in', { email })
    try {
      const { error } = await signIn(email, password)
      console.log('[SignInForm] signIn result', { error })
      if (error) {
        setError(error.message)
        onMessage(error.message, 'error')
      } else {
        onMessage('Sign in successful!', 'success')
        // wait for `useEffect` to handle redirect
      }
    } catch (err) {
      console.error('[SignInForm] signIn threw error', err)
      onMessage('Unexpected error', 'error')
    } finally {
      setLoading(false)
      console.log('[SignInForm] setLoading(false) called')
    }
  }

  const isButtonDisabled = loading || authLoading
  if (isButtonDisabled) {
    console.log('[SignInForm] Button disabled', { loading, authLoading })
  }

  return (
    <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
        />
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full bg-[#486681] hover:bg-[#3d5970] text-white"
          disabled={isButtonDisabled}
        >
          {isButtonDisabled ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>
  )
}
