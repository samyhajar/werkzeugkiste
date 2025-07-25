'use client'

import { useAuth } from '@/contexts/AuthContext'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, profileLoading, isAdmin, profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      // The signOut function in AuthContext will handle the redirect
    } catch (error) {
      console.error('[AdminLayout] Error during logout:', error)
    }
  }

  // Show loading state while auth or profile is loading
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state if not admin
  if (!isAdmin() || !profile) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white mb-4">You don&apos;t have permission to access the admin panel.</p>
          <button
            onClick={() => window.location.href = '/'}
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
        profile={profile}
        role={profile.role}
        userEmail={profile.email}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto ml-64 bg-[#6e859a]">
        {children}
      </main>
    </div>
  )
}
