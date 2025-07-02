'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface SignUpFormProps {
  onMessage: (msg: string, type?: 'success' | 'error') => void
}

export default function SignUpForm({ onMessage }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()

  // Sign up using AuthContext (client-side)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp(email, password, {
      full_name: fullName,
      role: role,
    })

    if (error) {
      onMessage(error.message, 'error')
    } else {
      onMessage('Account created! Please check your email for verification.', 'success')
    }
    setLoading(false)
  }

  // Alternative: Sign up using API route
  const handleSignUpAPI = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role
        }),
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        onMessage(data.error || 'Signup failed', 'error')
      } else {
        onMessage('Account created! Please check your email for verification.', 'success')
      }
    } catch (_error) {
      onMessage('Network error occurred', 'error')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={(e) => void handleSignUp(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Account Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={role === 'student' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRole('student')}
          >
            Student
          </Button>
          <Button
            type="button"
            variant={role === 'admin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRole('admin')}
          >
            Admin
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {role}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full bg-[#486681] hover:bg-[#3d5970] text-white"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#486681] text-[#486681]"
          disabled={loading}
          onClick={(e) => void handleSignUpAPI(e as unknown as React.FormEvent)}
        >
          {loading ? 'Creating account...' : 'Create Account (API)'}
        </Button>
      </div>
    </form>
  )
}