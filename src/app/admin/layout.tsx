'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, role, loading, signOut } = useAuth()
  const router = useRouter()

  // Redirect logic handled **after** auth finishes
  useEffect(() => {
    if (loading) return

    if (!user || !profile) {
      router.replace('/login')
      return
    }
    if (role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [loading, user, profile, role, router])

  if (loading || !user || !profile || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        profile={profile}
        role={role || 'admin'}
        userEmail={user.email || ''}
        onLogout={() => void handleLogout()}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
