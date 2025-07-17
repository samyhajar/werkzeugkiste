'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
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

export default function AdminDashboard() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getBrowserClient()

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const activities: RecentActivity[] = []

        // ‑‑‑ recent registrations ------------------------------------------------
        const { data: newStudents } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false })
          .limit(5)

        newStudents?.forEach((s) => {
          if (s.created_at)
            activities.push({
              id: `registration-${s.id}`,
              type: 'registration',
              title: 'New student registration',
              description: `${s.full_name || 'Anonymous'} joined the platform`,
              timestamp: s.created_at,
              user_name: s.full_name || 'Anonymous',
              badge_color: 'bg-green-500',
            })
        })

        // ‑‑‑ lesson completions ---------------------------------------------------
        const { data: recentCompletions } = await supabase
          .from('lesson_progress')
          .select('completed_at, lessons(title), profiles(full_name)')
          .order('completed_at', { ascending: false })
          .limit(5)

        recentCompletions?.forEach((c) => {
          if (c.completed_at)
            activities.push({
              id: `completion-${c.completed_at}`,
              type: 'lesson_completion',
              title: 'Lesson completed',
              description: `${(c.profiles as any)?.full_name || 'Student'} completed “${
                (c.lessons as any)?.title || 'Unknown lesson'
              }”`,
              timestamp: c.completed_at,
              user_name: (c.profiles as any)?.full_name,
              badge_color: 'bg-blue-500',
            })
        })

        // ‑‑‑ quiz attempts --------------------------------------------------------
        const { data: recentQuizAttempts } = await supabase
          .from('quiz_attempts')
          .select(
            'attempted_at, score, passed, quizzes(title), profiles(full_name)'
          )
          .order('attempted_at', { ascending: false })
          .limit(5)

        recentQuizAttempts?.forEach((a) => {
          if (a.attempted_at)
            activities.push({
              id: `quiz-${a.attempted_at}`,
              type: 'quiz_attempt',
              title: a.passed ? 'Quiz passed' : 'Quiz attempted',
              description: `${(a.profiles as any)?.full_name || 'Student'} ${
                a.passed ? 'passed' : 'attempted'
              } “${(a.quizzes as any)?.title || 'Unknown quiz'}” (${a.score}%)`,
              timestamp: a.attempted_at,
              user_name: (a.profiles as any)?.full_name,
              badge_color: a.passed ? 'bg-emerald-500' : 'bg-yellow-500',
            })
        })

        // ‑‑‑ newly created content -----------------------------------------------
        const { data: recentCourses } = await supabase
          .from('courses')
          .select('created_at, title')
          .order('created_at', { ascending: false })
          .limit(3)

        recentCourses?.forEach((c) => {
          if (c.created_at)
            activities.push({
              id: `course-${c.created_at}`,
              type: 'content_created',
              title: 'New course created',
              description: `Course “${c.title}” was created`,
              timestamp: c.created_at,
              badge_color: 'bg-purple-500',
            })
        })

        const { data: recentLessons } = await supabase
          .from('lessons')
          .select('created_at, title')
          .order('created_at', { ascending: false })
          .limit(3)

        recentLessons?.forEach((l) => {
          if (l.created_at)
            activities.push({
              id: `lesson-${l.created_at}`,
              type: 'content_created',
              title: 'New lesson created',
              description: `Lesson “${l.title}” was created`,
              timestamp: l.created_at,
              badge_color: 'bg-indigo-500',
            })
        })

        // sort & keep ten newest
        activities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setRecentActivities(activities.slice(0, 10))
      } catch (err) {
        console.error('Error fetching recent activities:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivities()
  }, []) // ← empty deps, runs once

  // icon helper
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration':
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      case 'lesson_completion':
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'quiz_attempt':
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        )
      case 'content_created':
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl space-y-8">
        {/* Stats Grid */}
        <AdminStatsGrid />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                asChild
                className="h-auto p-6 flex flex-col items-center gap-2"
              >
                <Link href="/admin/modules">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>Manage Modules</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-2"
              >
                <Link href="/admin/lessons">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Manage Lessons</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-2"
              >
                <Link href="/admin/quizzes">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span>Manage Quizzes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform activity and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.badge_color || 'bg-gray-500'
                      } text-white`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">
                          {activity.title}
                        </h4>
                        <span className="text-sm text-foreground/60">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/70">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>No recent activity</p>
                <p className="text-sm">
                  Activity will appear here once you start managing content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
