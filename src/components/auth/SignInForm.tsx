'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

import { getBrowserClient } from '@/lib/supabase/browser-client'


export default function SignInForm({
  onMessage,
}: {
  onMessage: (msg: string, type: 'success' | 'error') => void
}) {
  const router = useRouter()

  const { signIn } = useAuth()

  const supabase = getBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    onMessage('', 'success') // clear previous message

    console.log('[SignInForm] submitting', { email })

    const { error } = await signIn(email, password)

    setLoading(false)

    if (error) {
      console.error('[SignInForm] error', error.message)
      onMessage(error.message, 'error')
      return
    }

    console.log('[SignInForm] success')
    const { session } = await res.json()
    if (session) {
      console.log('[SignInForm] setting Supabase session')
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
      console.log('[SignInForm] session set, refreshing router')
      router.refresh()
    }
    onMessage('Logged in ✔︎', 'success')
    router.replace('/dashboard')
    // Reload to ensure AuthProvider picks up the new session
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="input input-bordered w-full"
      />
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="input input-bordered w-full"
      />

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
