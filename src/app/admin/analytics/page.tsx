'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AnalyticsHeader from '@/components/admin/AnalyticsHeader'
import AnalyticsOverviewCards from '@/components/admin/AnalyticsOverviewCards'
import AnalyticsRecentActivity from '@/components/admin/AnalyticsRecentActivity'

interface Analytics {
  overview: {
    totalCourses: number
    publishedCourses: number
    draftCourses: number
    totalLessons: number
    totalQuizzes: number
    totalStudents: number
  }
  recent: {
    coursesThisWeek: number
    lessonsThisWeek: number
    quizzesThisWeek: number
    studentsThisWeek: number
    coursesThisMonth: number
    lessonsThisMonth: number
    quizzesThisMonth: number
    studentsThisMonth: number
  }
  trends: {
    courses: Array<{ id: string; created_at: string; status: string }>
    students: Array<{ id: string; created_at: string }>
  }
}

interface ApiResponse {
  success: boolean
  analytics?: Analytics
  error?: string
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json() as ApiResponse

      if (!result.success || !result.analytics) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }

      setAnalytics(result.analytics)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="shadow-lg p-8 max-w-md mx-auto">
          <CardContent className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486682] mx-auto"></div>
            <div className="text-lg font-medium text-[#486682]">Loading Analytics...</div>
            <p className="text-gray-500">
              Gathering platform insights and performance metrics
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="shadow-lg p-8 max-w-md mx-auto">
          <CardContent className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <div className="text-lg font-medium text-red-600">Error Loading Analytics</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <Button
              onClick={() => void fetchAnalytics()}
              className="bg-[#486682] hover:bg-[#3e5570] text-white"
            >
              <span className="mr-2">🔄</span>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader onRefresh={fetchAnalytics} isLoading={loading} />
      <AnalyticsOverviewCards analytics={analytics} />
      <AnalyticsRecentActivity analytics={analytics} />

      {/* Export Section */}
      <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download detailed analytics reports
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-[#486682] text-[#486682] hover:bg-[#486682]/10"
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="border-[#486682] text-[#486682] hover:bg-[#486682]/10"
              >
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}