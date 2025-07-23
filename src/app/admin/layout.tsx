'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { AuthUser } from '@/types/api'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()
  const authCheckInProgress = useRef(false)
  const lastAuthCheck = useRef<number>(0)

  const handleLogout = async () => {
    try {
      // Call the improved logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      // Always redirect, regardless of API response
      router.replace('/')
    } catch (error) {
      // Force redirect even if logout API fails
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
          full_name: user.full_name,
          role: user.role,
          email: user.email,
          first_name: null,
          created_at: null,
          updated_at: null
        }}
        role={user.role}
        userEmail={user.email}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto ml-64 bg-[#6e859a]">
        {children}
      </main>
    </div>
  )
}
