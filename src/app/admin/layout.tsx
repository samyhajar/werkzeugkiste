'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AuthUser {
  id: string
  email: string
  full_name?: string
  role?: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()
  const { signOut } = useAuth()
  const authCheckInProgress = useRef(false)
  const lastAuthCheck = useRef<number>(0)

  const handleLogout = async () => {
    try {
      await signOut()
      // The signOut function in AuthContext will handle the redirect
    } catch (error) {
      console.error('[AdminLayout] Error during logout:', error)
      // Force redirect on error
      router.replace('/')
    }
  }

  useEffect(() => {
    // Prevent duplicate auth checks
    if (authCheckInProgress.current) {
      return
    }

    // Debounce auth checks
    const now = Date.now()
    if (now - lastAuthCheck.current < 1000) {
      return
    }

    authCheckInProgress.current = true
    lastAuthCheck.current = now

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          setLoading(false)
          router.replace('/')
          return
        }

        const data = await response.json()

        if (data.authenticated && data.user && data.isAdmin) {
          setIsAdmin(true)
          setUser(data.user)
          setLoading(false)
        } else {
          setLoading(false)
          router.replace('/')
        }
      } catch (error) {
        setLoading(false)
        router.replace('/')
      } finally {
        authCheckInProgress.current = false
      }
    }

    void checkAuth()
  }, [router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white mb-4">You don&apos;t have permission to access the admin panel.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-[#6e859a] px-4 py-2 rounded hover:bg-gray-100"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Show admin layout
  return (
    <div className="flex h-screen bg-[#6e859a]">
      <AdminSidebar
        profile={{
          id: user.id,
          full_name: user.full_name || null,
          role: user.role || null,
          email: user.email,
          first_name: null,
          created_at: null,
          updated_at: null
        }}
        role={user.role || 'admin'}
        userEmail={user.email}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto ml-64 bg-[#6e859a]">
        {children}
      </main>
    </div>
  )
}
