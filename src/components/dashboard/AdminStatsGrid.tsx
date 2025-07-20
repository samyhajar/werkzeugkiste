'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStats {
  totalStudents: number
  totalCourses: number
  publishedCourses: number
  totalLessons: number
  totalQuizzes: number
}

interface AdminStatsGridProps {
  stats: AdminStats
}

export default function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Registered learners',
      icon: '👥',
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      description: 'All courses',
      icon: '📚',
    },
    {
      title: 'Published Courses',
      value: stats.publishedCourses,
      description: 'Live courses',
      icon: '🚀',
    },
    {
      title: 'Total Lessons',
      value: stats.totalLessons,
      description: 'Learning content',
      icon: '📖',
    },
    {
      title: 'Total Quizzes',
      value: stats.totalQuizzes,
      description: 'Assessments',
      icon: '❓',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
