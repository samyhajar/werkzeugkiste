'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { AuthResponse, AuthUser } from '@/types/api'

interface AdminAuthResponse {
  authenticated: boolean
  user: AuthUser | null
  isAdmin: boolean
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()

  console.log('[AdminLayout] render', { isAuthenticated, isAdmin, loading, user: user?.email })

  const handleLogout = async () => {
    try {
      console.log('[AdminLayout] Starting admin logout...')

      // Call the improved logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json() as AuthResponse
      console.log('[AdminLayout] Logout API response:', data)

      // Always redirect, regardless of API response
      console.log('[AdminLayout] Redirecting to home...')
      router.replace('/')

    } catch (error) {
      console.error('[AdminLayout] Logout error:', error)
      // Force redirect even if logout API fails
      console.log('[AdminLayout] Force redirecting due to error...')
      router.replace('/')
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AdminLayout] Starting auth check via API...')

      // Add timeout to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        console.log('[AdminLayout] TIMEOUT - Auth check took too long, redirecting to home')
        setLoading(false)
        router.replace('/')
      }, 10000) // 10 second timeout

      try {
        console.log('[AdminLayout] Calling /api/auth/me...')
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Important: include cookies
        })

        console.log('[AdminLayout] API response status:', response.status)

        if (!response.ok) {
          console.log('[AdminLayout] API returned error status, redirecting to home')
          clearTimeout(timeoutId)
          setIsAuthenticated(false)
          setIsAdmin(false)
          setUser(null)
          router.replace('/')
          return
        }

        const data = await response.json() as AdminAuthResponse
        console.log('[AdminLayout] API response data:', data)

        if (data.authenticated && data.user) {
          console.log('[AdminLayout] User authenticated:', {
            email: data.user.email,
            role: data.user.role,
            isAdmin: data.isAdmin
          })

          setIsAuthenticated(true)
          setIsAdmin(data.isAdmin)
          setUser(data.user)

          if (!data.isAdmin) {
            console.log('[AdminLayout] User not admin, redirecting to home page')
            router.replace('/')
            return
          }

          console.log('[AdminLayout] Admin user authenticated successfully!')
        } else {
          console.log('[AdminLayout] User not authenticated, redirecting to home')
          setIsAuthenticated(false)
          setIsAdmin(false)
          setUser(null)
          router.replace('/')
          return
        }

        clearTimeout(timeoutId)
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('[AdminLayout] Auth check error:', error)
        setIsAuthenticated(false)
        setIsAdmin(false)
        setUser(null)
        router.replace('/')
        return
      } finally {
        console.log('[AdminLayout] Setting loading to false')
        setLoading(false)
      }
    }

    void checkAuth()
  }, [router])

  // Show loading state
  if (loading) {
    console.log('[AdminLayout] Rendering loading state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state
  if (!isAuthenticated || !isAdmin) {
    console.log('[AdminLayout] Rendering unauthorized state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access the admin panel.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Show admin layout
  console.log('[AdminLayout] Rendering admin layout')

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">Unable to load user information.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
      <main className="flex-1 overflow-y-auto ml-64">
        {children}
      </main>
    </div>
  )
}
