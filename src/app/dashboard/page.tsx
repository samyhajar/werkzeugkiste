'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    console.log('[Dashboard] Redirecting to /')
    router.replace('/')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Wird weitergeleitet...</p>
      </div>
    </div>
  )
}