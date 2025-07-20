'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import AdminStatsGrid from '@/components/dashboard/AdminStatsGrid'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivity {
  id: string
  type: 'registration' | 'lesson_completion' | 'quiz_attempt' | 'content_created'
  title: string
  description: string
  timestamp: string
  user_name?: string
  badge_color?: string
}

interface DashboardStats {
  totalStudents: number
  totalCourses: number
  publishedCourses: number
  totalLessons: number
  totalQuizzes: number
}

export default function AdminDashboard() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    totalQuizzes: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('[AdminDashboard] render')

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('[AdminDashboard] fetching dashboard data via API')
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/admin/dashboard', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('[AdminDashboard] API response:', data)

        if (data.success) {
          setRecentActivities(data.recentActivities || [])
          setStats(data.stats || {})
          console.log('[AdminDashboard] Data loaded successfully')
        } else {
          throw new Error(data.error || 'Failed to fetch dashboard data')
        }
      } catch (err) {
        console.error('[AdminDashboard] Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load dashboard</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your learning platform
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <AdminStatsGrid stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/admin/modules">
                  <span className="mr-2">📚</span>
                  Manage Modules
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/lessons">
                  <span className="mr-2">📖</span>
                  Manage Lessons
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/quizzes">
                  <span className="mr-2">❓</span>
                  Manage Quizzes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activity and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity to display
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-gray-50/50"
                    >
                      <div className="flex-shrink-0">
                        <Badge
                          className={`${activity.badge_color} text-white`}
                          variant="secondary"
                        >
                          {activity.type === 'registration' && '👤'}
                          {activity.type === 'lesson_completion' && '✅'}
                          {activity.type === 'quiz_attempt' && '🎯'}
                          {activity.type === 'content_created' && '📝'}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
