'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStats {
  totalModules: number
  totalLessons: number
  totalQuizzes: number
  totalStudents: number
  publishedModules: number
  activeStudents: number
}

export default function AdminStatsGrid() {
  const [stats, setStats] = useState<AdminStats>({
    totalModules: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalStudents: 0,
    publishedModules: 0,
    activeStudents: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = getBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: totalModules },
          { count: publishedModules },
          { count: totalLessons },
          { count: totalQuizzes },
          { count: totalStudents },
          { count: activeStudents },
        ] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published'),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('quizzes').select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student'),
          supabase
            .from('lesson_progress')
            .select('student_id', { count: 'exact', head: true }),
        ])

        setStats({
          totalModules: totalModules || 0,
          totalLessons: totalLessons || 0,
          totalQuizzes: totalQuizzes || 0,
          totalStudents: totalStudents || 0,
          publishedModules: publishedModules || 0,
          activeStudents: activeStudents || 0,
        })
      } catch (err) {
        console.error('Error fetching admin stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, []) // run once – supabase is a stable singleton

  // … rest of render (unchanged) …

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Modules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Modules</CardTitle>
          <CardDescription>Published & Draft</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand-primary">{stats.totalModules}</div>
          <p className="text-sm text-foreground/60 mt-1">
            {stats.publishedModules} published, {stats.totalModules - stats.publishedModules} draft
          </p>
        </CardContent>
      </Card>

      {/* Total Lessons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Lessons</CardTitle>
          <CardDescription>All lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand-secondary">{stats.totalLessons}</div>
          <p className="text-sm text-foreground/60 mt-1">
            {stats.totalLessons === 0
              ? 'No lessons yet'
              : `${stats.totalLessons} lesson${stats.totalLessons === 1 ? '' : 's'} created`}
          </p>
        </CardContent>
      </Card>

      {/* Total Quizzes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Quizzes</CardTitle>
          <CardDescription>All quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-600">{stats.totalQuizzes}</div>
          <p className="text-sm text-foreground/60 mt-1">
            {stats.totalQuizzes === 0
              ? 'No quizzes yet'
              : `${stats.totalQuizzes} quiz${stats.totalQuizzes === 1 ? '' : 'zes'} created`}
          </p>
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Students</CardTitle>
          <CardDescription>Active learners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-600">{stats.totalStudents}</div>
          <p className="text-sm text-foreground/60 mt-1">
            {stats.activeStudents} active, {stats.totalStudents - stats.activeStudents} inactive
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
