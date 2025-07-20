'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Analytics {
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
}

interface AnalyticsRecentActivityProps {
  analytics: Analytics
}

export default function AnalyticsRecentActivity({ analytics }: AnalyticsRecentActivityProps) {
  return (
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
  )
}