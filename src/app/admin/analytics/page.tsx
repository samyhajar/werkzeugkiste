'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

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

      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading analytics...</span>
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
            <div className="text-red-600 mb-2">Failed to load analytics</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchAnalytics()}
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

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Platform insights and performance metrics
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Courses</CardTitle>
            <CardDescription>All courses in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCourses}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">
                {analytics.overview.publishedCourses} published
              </Badge>
              <Badge variant="secondary">
                {analytics.overview.draftCourses} draft
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Lessons</CardTitle>
            <CardDescription>All lessons across courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLessons}</div>
            <p className="text-sm text-gray-500 mt-2">
              {analytics.overview.totalCourses > 0
                ? Math.round(analytics.overview.totalLessons / analytics.overview.totalCourses)
                : 0} avg per course
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Quizzes</CardTitle>
            <CardDescription>All quizzes in lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalQuizzes}</div>
            <p className="text-sm text-gray-500 mt-2">
              {analytics.overview.totalLessons > 0
                ? Math.round(analytics.overview.totalQuizzes / analytics.overview.totalLessons * 100)
                : 0}% of lessons have quizzes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Students</CardTitle>
            <CardDescription>Registered student accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalStudents}</div>
            <p className="text-sm text-gray-500 mt-2">
              Active learners on the platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
            <CardDescription>Activity in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">New Courses</span>
              <Badge variant="outline">{analytics.recent.coursesThisWeek}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Lessons</span>
              <Badge variant="outline">{analytics.recent.lessonsThisWeek}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Quizzes</span>
              <Badge variant="outline">{analytics.recent.quizzesThisWeek}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Students</span>
              <Badge variant="outline">{analytics.recent.studentsThisWeek}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
            <CardDescription>Activity in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">New Courses</span>
              <Badge variant="outline">{analytics.recent.coursesThisMonth}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Lessons</span>
              <Badge variant="outline">{analytics.recent.lessonsThisMonth}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Quizzes</span>
              <Badge variant="outline">{analytics.recent.quizzesThisMonth}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Students</span>
              <Badge variant="outline">{analytics.recent.studentsThisMonth}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Courses</CardTitle>
            <CardDescription>Latest courses created</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.trends.courses.length === 0 ? (
              <p className="text-gray-500 text-sm">No courses created yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.trends.courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-sm">Course</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Students</CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.trends.students.length === 0 ? (
              <p className="text-gray-500 text-sm">No students registered yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.trends.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <span className="text-sm">New Student</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Growth</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.overview.publishedCourses > 0
                  ? Math.round((analytics.overview.publishedCourses / analytics.overview.totalCourses) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-gray-500">Courses Published</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.overview.totalLessons}
              </div>
              <p className="text-sm text-gray-500">Content Items</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.recent.studentsThisMonth}
              </div>
              <p className="text-sm text-gray-500">New Students (30d)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.recent.coursesThisMonth + analytics.recent.lessonsThisMonth + analytics.recent.quizzesThisMonth}
              </div>
              <p className="text-sm text-gray-500">Content Created (30d)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}