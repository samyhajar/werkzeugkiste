import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/dashboard/LogoutButton'

export default async function Dashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-foreground/60 mt-2">
                Welcome back, {user.email}!
              </p>
            </div>
            <LogoutButton />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-background border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-brand-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Profile
              </h3>
              <p className="text-foreground/60 text-sm">
                Manage your account settings and preferences.
              </p>
            </div>

            <div className="bg-background border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-brand-secondary rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Projects
              </h3>
              <p className="text-foreground/60 text-sm">
                View and manage your active projects and tasks.
              </p>
            </div>

            <div className="bg-background border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Analytics
              </h3>
              <p className="text-foreground/60 text-sm">
                Track your progress and view detailed analytics.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-background border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              User Information
            </h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-foreground">Email:</span>{' '}
                <span className="text-foreground/70">{user.email}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-foreground">User ID:</span>{' '}
                <span className="text-foreground/70 font-mono text-xs">
                  {user.id}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-foreground">
                  Email Verified:
                </span>{' '}
                <span className="text-foreground/70">
                  {user.email_confirmed_at ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-foreground">Last Sign In:</span>{' '}
                <span className="text-foreground/70">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}