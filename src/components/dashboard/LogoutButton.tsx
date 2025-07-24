'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LogoutButton() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR/build time
  if (!mounted) {
    return <button className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200" disabled>Loading...</button>
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('[LogoutButton] Logout error:', error)
      // Force redirect even if logout fails
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={() => void handleLogout()}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}