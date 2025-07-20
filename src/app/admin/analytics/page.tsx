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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Platform insights and performance metrics</p>
          </div>
        </div>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-red-50/30">
          <CardContent className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <div className="text-red-600 mb-2 font-semibold">Failed to load analytics</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <Button
              onClick={() => fetchAnalytics()}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Platform insights and performance metrics
          </p>
        </div>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          className="border-[#486682] text-[#486682] hover:bg-[#486682]/10 shadow-sm"
        >
          <span className="mr-2">🔄</span>
          Refresh Data
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#486682]">Total Courses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
              <span className="text-white text-sm">📚</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalCourses}</div>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-[#486682] text-white">
                {analytics.overview.publishedCourses} published
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                {analytics.overview.draftCourses} draft
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Lessons</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
              <span className="text-white text-sm">📖</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalLessons}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.overview.totalCourses > 0
                ? Math.round(analytics.overview.totalLessons / analytics.overview.totalCourses)
                : 0} avg per course
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Quizzes</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
              <span className="text-white text-sm">❓</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalQuizzes}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.overview.totalLessons > 0
                ? Math.round(analytics.overview.totalQuizzes / analytics.overview.totalLessons * 100)
                : 0}% of lessons have quizzes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Total Students</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
              <span className="text-white text-sm">👥</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalStudents}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active learners on the platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-[#486682]/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <CardTitle className="text-lg text-[#486682]">This Week</CardTitle>
                <CardDescription className="text-sm">Activity in the last 7 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#486682] rounded-full"></div>
                <span className="text-sm font-medium">New Courses</span>
              </div>
              <Badge className="bg-[#486682]/10 text-[#486682] border-[#486682]/20">
                {analytics.recent.coursesThisWeek}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">New Lessons</span>
              </div>
              <Badge className="bg-green-600/10 text-green-600 border-green-600/20">
                {analytics.recent.lessonsThisWeek}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-sm font-medium">New Quizzes</span>
              </div>
              <Badge className="bg-purple-600/10 text-purple-600 border-purple-600/20">
                {analytics.recent.quizzesThisWeek}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-sm font-medium">New Students</span>
              </div>
              <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20">
                {analytics.recent.studentsThisWeek}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
                <span className="text-white text-lg">📈</span>
              </div>
              <div>
                <CardTitle className="text-lg text-indigo-700">This Month</CardTitle>
                <CardDescription className="text-sm">Activity in the last 30 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#486682] rounded-full"></div>
                <span className="text-sm font-medium">New Courses</span>
              </div>
              <Badge className="bg-[#486682]/10 text-[#486682] border-[#486682]/20">
                {analytics.recent.coursesThisMonth}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">New Lessons</span>
              </div>
              <Badge className="bg-green-600/10 text-green-600 border-green-600/20">
                {analytics.recent.lessonsThisMonth}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-sm font-medium">New Quizzes</span>
              </div>
              <Badge className="bg-purple-600/10 text-purple-600 border-purple-600/20">
                {analytics.recent.quizzesThisMonth}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-sm font-medium">New Students</span>
              </div>
              <Badge className="bg-amber-600/10 text-amber-600 border-amber-600/20">
                {analytics.recent.studentsThisMonth}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <CardTitle className="text-lg text-[#486682]">Recent Courses</CardTitle>
                <CardDescription className="text-sm">Latest courses created</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analytics.trends.courses.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📚</span>
                </div>
                <p className="text-gray-500 text-sm">No courses created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.trends.courses.map((course, index) => (
                  <div key={course.id} className="p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">Course Created</span>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={course.status === 'published'
                          ? 'bg-[#486682] text-white'
                          : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <div>
                <CardTitle className="text-lg text-emerald-700">Recent Students</CardTitle>
                <CardDescription className="text-sm">Latest student registrations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analytics.trends.students.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">👥</span>
                </div>
                <p className="text-gray-500 text-sm">No students registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.trends.students.map((student, index) => (
                  <div key={student.id} className="p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">New Student</span>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20">
                        Registered
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <span className="text-white text-xl">🚀</span>
            </div>
            <div>
              <CardTitle className="text-xl text-slate-700">Platform Growth</CardTitle>
              <CardDescription className="text-sm">Key performance indicators</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-lg">📊</span>
              </div>
              <div className="text-2xl font-bold text-[#486682] mb-1">
                {analytics.overview.publishedCourses > 0
                  ? Math.round((analytics.overview.publishedCourses / analytics.overview.totalCourses) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-gray-600 font-medium">Courses Published</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-lg">📝</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {analytics.overview.totalLessons}
              </div>
              <p className="text-sm text-gray-600 font-medium">Content Items</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-lg">👨‍🎓</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {analytics.recent.studentsThisMonth}
              </div>
              <p className="text-sm text-gray-600 font-medium">New Students (30d)</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-lg">✨</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {analytics.recent.coursesThisMonth + analytics.recent.lessonsThisMonth + analytics.recent.quizzesThisMonth}
              </div>
              <p className="text-sm text-gray-600 font-medium">Content Created (30d)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}