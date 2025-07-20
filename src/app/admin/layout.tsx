'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

interface User {
  id: string
  email: string
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<User | null>(null)
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

      const data = await response.json()
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

        const data = await response.json()
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

    checkAuth()
  }, [router])

  // Show loading state
  if (loading) {
    console.log('[AdminLayout] Rendering loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-gray-600">Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !isAdmin || !user) {
    console.log('[AdminLayout] Not authenticated or not admin, returning null')
    return null
  }

  // Create a mock profile object for AdminSidebar
  const mockProfile = {
    id: user.id,
    email: user.email,
    full_name: user.email.split('@')[0], // Use email username as display name
    role: user.role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('[AdminLayout] Rendering admin dashboard')
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        profile={mockProfile}
        role={user.role}
        userEmail={user.email}
        onLogout={handleLogout}
      />
      <main className="pl-64">
        <div className="min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
