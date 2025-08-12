'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/dashboard/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, profileLoading, isAdmin, profile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      // The signOut function in AuthContext will handle the redirect
    } catch (error) {
      console.error('[AdminLayout] Error during logout:', error)
    }
  }

  // Block only during the very first load (no profile yet). Do not block on subsequent profileLoading toggles.
  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // If we don't yet have a profile (brief moment after login), render a light loading state
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Preparing admin dashboard…</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state only when we are not loading and can confirm non-admin
  if (!loading && !profileLoading && !isAdmin()) {
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
    <div className="flex h-screen bg-[#6e859a] relative">
      <AdminSidebar
        profile={profile}
        role={profile.role}
        userEmail={profile.email}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto ml-64 bg-[#6e859a]">
        {children}
      </main>
      {profileLoading && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-white/90">
          <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          <span className="text-sm">Aktualisiere Profil…</span>
        </div>
      )}
    </div>
  )
}
