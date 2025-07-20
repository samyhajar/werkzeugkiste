'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Analytics {
  overview: {
    totalCourses: number
    publishedCourses: number
    draftCourses: number
    totalLessons: number
    totalQuizzes: number
    totalStudents: number
  }
}

interface AnalyticsOverviewCardsProps {
  analytics: Analytics
}

export default function AnalyticsOverviewCards({ analytics }: AnalyticsOverviewCardsProps) {
  return (
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
            Active learners
          </p>
        </CardContent>
      </Card>
    </div>
  )
}