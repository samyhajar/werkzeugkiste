'use client'

import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    setLoading(false)
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