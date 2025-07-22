'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { CardDescription } from '@/components/ui/card'

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
      title: 'Teilnehmer gesamt',
      value: stats.totalStudents,
      description: 'Registrierte Lernende',
      icon: '',
    },
    {
      title: 'Kurse gesamt',
      value: stats.totalCourses,
      description: 'Alle Kurse',
      icon: '',
    },
    {
      title: 'Veröffentlichte Kurse',
      value: stats.publishedCourses,
      description: 'Aktive Kurse',
      icon: '',
    },
    {
      title: 'Lektionen gesamt',
      value: stats.totalLessons,
      description: 'Lerninhalte',
      icon: '',
    },
    {
      title: 'Quizze gesamt',
      value: stats.totalQuizzes,
      description: 'Bewertungen',
      icon: '',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#486681]">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
