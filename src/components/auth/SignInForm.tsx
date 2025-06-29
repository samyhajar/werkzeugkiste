'use client'

import { useState } from 'react'
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

  const router = useRouter()
  const { signIn } = useAuth()

  // Sign in using AuthContext (client-side)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      onMessage(error.message, 'error')
    } else {
      onMessage('Sign in successful!', 'success')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  // Alternative: Sign in using API route
  const handleSignInAPI = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        onMessage(data.error || 'Login failed', 'error')
      } else {
        onMessage('Sign in successful!', 'success')
        // The AuthContext will automatically update via the auth state change listener
        router.push('/dashboard')
      }
    } catch (_error) {
      onMessage('Network error occurred', 'error')
    }
    setLoading(false)
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
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
                <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={() => void handleSignInAPI(new Event('click') as unknown as React.FormEvent)}
        >
          {loading ? 'Signing in...' : 'Sign In (API)'}
        </Button>
      </div>
    </form>
  )
}