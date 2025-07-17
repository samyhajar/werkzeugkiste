'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInForm({
  onMessage,
}: {
  onMessage: (msg: string, type: 'success' | 'error') => void
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    onMessage('', 'success') // clear previous message

    console.log('[SignInForm] submitting', { email })

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // must keep cookies
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    console.log('[SignInForm] response', res.status)

    setLoading(false)
    console.log('[SignInForm] finished', res.ok)

    if (!res.ok) {
      /* ---- Safe JSON (or text) extraction ---- */
      let errorMsg = `Error ${res.status}`
      try {
        const data = await res.clone().json()
        errorMsg = data?.error ?? errorMsg
      } catch {
        try {
          errorMsg = await res.text()
        } catch {
          /* leave default */
        }
      }
      console.error('[SignInForm] error', errorMsg)
      onMessage(errorMsg, 'error')
      return
    }

    console.log('[SignInForm] success')
    onMessage('Logged in ✔︎', 'success')
    router.replace('/dashboard')
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
