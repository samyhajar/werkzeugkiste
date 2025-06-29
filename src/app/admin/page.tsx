'use client'

import { useAuth } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import AdminStatsGrid from '@/components/dashboard/AdminStatsGrid'

export default function AdminDashboard() {
  const { user, profile, role, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    redirect('/login')
  }

  // Ensure only admins can access this
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const handleLogout = async () => {
    await signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        profile={profile}
        role={role || 'admin'}
        userEmail={user.email || ''}
        onLogout={() => void handleLogout()}
      />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h2>
            <p className="text-foreground/60">
              Manage courses, students, and platform content
            </p>
          </div>

          {/* Stats Grid */}
          <AdminStatsGrid />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button className="h-auto p-6 flex flex-col items-center gap-2">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Course</span>
                </Button>

                <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-2">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Manage Students</span>
                </Button>

                <Button variant="outline" className="h-auto p-6 flex flex-col items-center gap-2">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest platform activity and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-foreground/60">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here once you start managing content</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}