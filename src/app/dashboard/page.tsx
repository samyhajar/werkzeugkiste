'use client'

import { useAuth } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StudentHeader from '@/components/dashboard/StudentHeader'
import StudentCourseCards from '@/components/dashboard/StudentCourseCards'

export default function Dashboard() {
  const { user, profile, role, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    redirect('/login')
  }

  // Ensure students don't access this if they somehow get here
  if (role === 'admin') {
    redirect('/admin')
  }

  const handleLogout = async () => {
    await signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader
        profile={profile}
        role={role || 'student'}
        userEmail={user.email || ''}
        onLogout={() => void handleLogout()}
      />

      {/* Main Content */}
      <main className="max-w-[900px] mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Welcome back, {profile.full_name || 'Student'}!
            </h2>
            <p className="text-foreground/60">
              Continue your learning journey. Browse available courses and track your progress.
            </p>
          </div>

          {/* Course Cards Grid */}
          <StudentCourseCards />

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your profile details and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Name</p>
                    <p className="text-sm text-foreground/70">
                      {profile.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-foreground/70">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Account Type</p>
                    <Badge variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Member Since</p>
                    <p className="text-sm text-foreground/70">
                      {new Date(profile.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}