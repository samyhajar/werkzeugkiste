'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'

interface AnalyticsData {
  totalStudents: number
  activeStudents: number
  totalCourses: number
  publishedCourses: number
  totalLessons: number
  totalQuizzes: number
  totalCompletions: number
  totalQuizAttempts: number
  averageQuizScore: number
  topCourses: Array<{
    id: string
    title: string
    completions: number
    enrollments: number
    completionRate: number
  }>
  studentEngagement: Array<{
    id: string
    name: string
    lessonsCompleted: number
    quizzesTaken: number
    averageScore: number
    lastActivity: string | null
  }>
  quizPerformance: Array<{
    id: string
    title: string
    attempts: number
    averageScore: number
    passRate: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalLessons: 0,
    totalQuizzes: 0,
    totalCompletions: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0,
    topCourses: [],
    studentEngagement: [],
    quizPerformance: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Basic counts
        const [
          { count: totalStudents },
          { count: totalCourses },
          { count: publishedCourses },
          { count: totalLessons },
          { count: totalQuizzes },
          { count: totalCompletions },
          { count: totalQuizAttempts },
          { count: activeStudents }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('quizzes').select('*', { count: 'exact', head: true }),
          supabase.from('lesson_progress').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
          supabase.from('lesson_progress').select('student_id', { count: 'exact', head: true })
        ])

        // Average quiz score
        const { data: quizScores } = await supabase
          .from('quiz_attempts')
          .select('score')

        const averageQuizScore = quizScores && quizScores.length > 0
          ? Math.round(quizScores.reduce((sum, attempt) => sum + attempt.score, 0) / quizScores.length)
          : 0

        // Top courses by completion rate
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .eq('status', 'published')

        const topCourses = await Promise.all(
          (coursesData || []).map(async (course) => {
            const { count: totalLessonsInCourse } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id)

            const { data: studentsWithProgress } = await supabase
              .from('lesson_progress')
              .select('student_id, lessons!inner(course_id)')
              .eq('lessons.course_id', course.id)

            const uniqueStudents = new Set(studentsWithProgress?.map(p => p.student_id) || [])
            const enrollments = uniqueStudents.size

            // Calculate completions (students who completed ALL lessons in the course)
            const completions = await Promise.all(
              Array.from(uniqueStudents).map(async (studentId) => {
                const { count: studentCompletedLessons } = await supabase
                  .from('lesson_progress')
                  .select('*, lessons!inner(course_id)', { count: 'exact', head: true })
                  .eq('student_id', studentId)
                  .eq('lessons.course_id', course.id)

                return studentCompletedLessons === totalLessonsInCourse
              })
            )

            const completionCount = completions.filter(Boolean).length
            const completionRate = enrollments > 0 ? Math.round((completionCount / enrollments) * 100) : 0

            return {
              id: course.id,
              title: course.title,
              completions: completionCount,
              enrollments,
              completionRate
            }
          })
        )

        // Student engagement
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'student')
          .limit(10)

        const studentEngagement = await Promise.all(
          (studentsData || []).map(async (student) => {
            const { count: lessonsCompleted } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', student.id)

            const { count: quizzesTaken } = await supabase
              .from('quiz_attempts')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', student.id)

            const { data: quizScores } = await supabase
              .from('quiz_attempts')
              .select('score')
              .eq('student_id', student.id)

            const averageScore = quizScores && quizScores.length > 0
              ? Math.round(quizScores.reduce((sum, attempt) => sum + attempt.score, 0) / quizScores.length)
              : 0

            const { data: lastActivity } = await supabase
              .from('lesson_progress')
              .select('completed_at')
              .eq('student_id', student.id)
              .order('completed_at', { ascending: false })
              .limit(1)

            return {
              id: student.id,
              name: student.full_name || 'Anonymous',
              lessonsCompleted: lessonsCompleted || 0,
              quizzesTaken: quizzesTaken || 0,
              averageScore,
              lastActivity: lastActivity?.[0]?.completed_at || null
            }
          })
        )

        // Quiz performance
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('id, title')
          .limit(10)

        const quizPerformance = await Promise.all(
          (quizzesData || []).map(async (quiz) => {
            const { count: attempts } = await supabase
              .from('quiz_attempts')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id)

            const { data: attemptScores } = await supabase
              .from('quiz_attempts')
              .select('score, passed')
              .eq('quiz_id', quiz.id)

            const averageScore = attemptScores && attemptScores.length > 0
              ? Math.round(attemptScores.reduce((sum, attempt) => sum + attempt.score, 0) / attemptScores.length)
              : 0

            const passRate = attemptScores && attemptScores.length > 0
              ? Math.round((attemptScores.filter(attempt => attempt.passed).length / attemptScores.length) * 100)
              : 0

            return {
              id: quiz.id,
              title: quiz.title,
              attempts: attempts || 0,
              averageScore,
              passRate
            }
          })
        )

        setAnalytics({
          totalStudents: totalStudents || 0,
          activeStudents: activeStudents || 0,
          totalCourses: totalCourses || 0,
          publishedCourses: publishedCourses || 0,
          totalLessons: totalLessons || 0,
          totalQuizzes: totalQuizzes || 0,
          totalCompletions: totalCompletions || 0,
          totalQuizAttempts: totalQuizAttempts || 0,
          averageQuizScore,
          topCourses: topCourses.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5),
          studentEngagement: studentEngagement.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted),
          quizPerformance: quizPerformance.sort((a, b) => b.attempts - a.attempts)
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl space-y-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">
            Detailed insights into platform usage and student engagement
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Student Engagement</CardTitle>
              <CardDescription>Active vs Total Students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-primary mb-2">
                {analytics.totalStudents > 0 ? Math.round((analytics.activeStudents / analytics.totalStudents) * 100) : 0}%
              </div>
              <p className="text-sm text-foreground/60">
                {analytics.activeStudents} of {analytics.totalStudents} students are active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Course Completion</CardTitle>
              <CardDescription>Total lesson completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-brand-secondary mb-2">
                {analytics.totalCompletions}
              </div>
              <p className="text-sm text-foreground/60">
                Across {analytics.totalLessons} lessons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quiz Performance</CardTitle>
              <CardDescription>Average quiz score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {analytics.averageQuizScore}%
              </div>
              <p className="text-sm text-foreground/60">
                From {analytics.totalQuizAttempts} attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Content Status</CardTitle>
              <CardDescription>Published vs Draft</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.publishedCourses}/{analytics.totalCourses}
              </div>
              <p className="text-sm text-foreground/60">
                Courses published
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
            <CardDescription>Courses with highest completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topCourses.length > 0 ? (
              <div className="space-y-4">
                {analytics.topCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{course.title}</h4>
                      <p className="text-sm text-foreground/60">
                        {course.completions} completions from {course.enrollments} enrollments
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brand-primary">{course.completionRate}%</div>
                        <div className="text-sm text-foreground/60">completion rate</div>
                      </div>
                      <Badge variant={course.completionRate >= 70 ? 'default' : course.completionRate >= 40 ? 'secondary' : 'outline'}>
                        {course.completionRate >= 70 ? 'Excellent' : course.completionRate >= 40 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No course data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>Student Engagement</CardTitle>
            <CardDescription>Most active students on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.studentEngagement.length > 0 ? (
              <div className="space-y-4">
                {analytics.studentEngagement.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{student.name}</h4>
                      <p className="text-sm text-foreground/60">
                        {student.lessonsCompleted} lessons completed • {student.quizzesTaken} quizzes taken
                      </p>
                      {student.lastActivity && (
                        <p className="text-xs text-foreground/50">
                          Last activity: {formatDistanceToNow(new Date(student.lastActivity), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-brand-primary">{student.averageScore}%</div>
                      <div className="text-sm text-foreground/60">avg score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No student engagement data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
            <CardDescription>Performance metrics for all quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.quizPerformance.length > 0 ? (
              <div className="space-y-4">
                {analytics.quizPerformance.map((quiz) => (
                  <div key={quiz.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{quiz.title}</h4>
                      <Badge variant={quiz.passRate >= 70 ? 'default' : quiz.passRate >= 50 ? 'secondary' : 'outline'}>
                        {quiz.passRate}% pass rate
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <span>{quiz.attempts} attempts</span>
                      <span>{quiz.averageScore}% average score</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={quiz.passRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No quiz performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}