import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server-client'

export default async function AdminTestPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Not Authenticated</div>
          <p className="text-gray-600 mb-4">User is not authenticated</p>
          <p className="text-sm text-gray-500">User ID: {user?.id || 'null'}</p>
          <p className="text-sm text-gray-500">Email: {user?.email || 'null'}</p>
        </div>
      </div>
    )
  }

  // Check if user is admin using profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Profile Error</div>
          <p className="text-gray-600 mb-4">Error fetching profile: {profileError.message}</p>
          <p className="text-sm text-gray-500">User ID: {user.id}</p>
          <p className="text-sm text-gray-500">Email: {user.email}</p>
        </div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Not Admin</div>
          <p className="text-gray-600 mb-4">User does not have admin role</p>
          <p className="text-sm text-gray-500">User ID: {user.id}</p>
          <p className="text-sm text-gray-500">Email: {user.email}</p>
          <p className="text-sm text-gray-500">Profile Role: {profile?.role || 'null'}</p>
          <p className="text-sm text-gray-500">Profile Name: {profile?.full_name || 'null'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-600 text-xl mb-4">✅ Admin Access Confirmed</div>
        <p className="text-gray-600 mb-4">User has admin access!</p>
        <p className="text-sm text-gray-500">User ID: {user.id}</p>
        <p className="text-sm text-gray-500">Email: {user.email}</p>
        <p className="text-sm text-gray-500">Profile Role: {profile.role}</p>
        <p className="text-sm text-gray-500">Profile Name: {profile.full_name}</p>
        <div className="mt-4">
          <a
            href="/admin"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}