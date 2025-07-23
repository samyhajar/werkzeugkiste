'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('[LogoutButton] Logout error:', error)
      // Force redirect even if logout fails
      router.push('/')
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