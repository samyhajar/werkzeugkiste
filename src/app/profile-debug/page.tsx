'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileDebugPage() {
  const { user, profile, role, loading } = useAuth()

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Not authenticated</div>
  }

  const updateToAdmin = async () => {
    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'admin'
        }),
      })

      const data = await response.json() as { error?: string }

      if (response.ok) {
        alert('Role updated! Please refresh the page.')
        window.location.reload()
      } else {
        alert(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (_error) {
      alert('Network error occurred')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>User ID:</strong> {user.id}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Profile ID:</strong> {profile?.id || 'No profile found'}
          </div>
          <div>
            <strong>Full Name:</strong> {profile?.full_name || 'Not set'}
          </div>
          <div>
            <strong>Current Role:</strong> {profile?.role || 'No role found'}
          </div>
          <div>
            <strong>Role (derived):</strong> {role || 'null'}
          </div>
          <div>
            <strong>Raw User Metadata:</strong>
            <pre className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>

          {profile?.role === 'student' && (
            <div className="pt-4">
              <Button onClick={() => void updateToAdmin()} variant="destructive">
                Update My Role to Admin
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will change your role from student to admin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}