import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch dashboard data
    const [
      profilesResult,
      coursesResult,
      lessonsResult,
      quizzesResult,
      lessonProgressResult,
      quizAttemptsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('courses')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('lessons')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('quizzes')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('lesson_progress')
        .select(
          'completed_at, lesson_id, student_id, lessons(title), profiles(full_name)'
        )
        .order('completed_at', { ascending: false })
        .limit(5),
      supabase
        .from('quiz_attempts')
        .select(
          'completed_at, score_percentage, passed, quiz_id, student_id, quizzes(title), profiles(full_name)'
        )
        .order('completed_at', { ascending: false })
        .limit(5),
    ])

    // Build recent activities
    const activities = []

    // Recent registrations
    if (profilesResult.data) {
      profilesResult.data.forEach((profile: any) => {
        if (profile.role === 'student') {
          activities.push({
            id: `registration-${profile.id}`,
            type: 'registration',
            title: 'New student registration',
            description: `${profile.full_name || 'Anonymous'} joined the platform`,
            timestamp: profile.created_at,
            user_name: profile.full_name || 'Anonymous',
            badge_color: 'bg-green-500',
          })
        }
      })
    }

    // Recent lesson completions
    if (lessonProgressResult.data) {
      lessonProgressResult.data.forEach((progress: any) => {
        activities.push({
          id: `completion-${progress.completed_at}`,
          type: 'lesson_completion',
          title: 'Lesson completed',
          description: `${progress.profiles?.full_name || 'Student'} completed "${progress.lessons?.title || 'Unknown lesson'}"`,
          timestamp: progress.completed_at,
          user_name: progress.profiles?.full_name,
          badge_color: 'bg-blue-500',
        })
      })
    }

    // Recent quiz attempts
    if (quizAttemptsResult.data) {
      quizAttemptsResult.data.forEach((attempt: any) => {
        activities.push({
          id: `quiz-${attempt.completed_at}`,
          type: 'quiz_attempt',
          title: attempt.passed ? 'Quiz passed' : 'Quiz attempted',
          description: `${attempt.profiles?.full_name || 'Student'} ${attempt.passed ? 'passed' : 'attempted'} "${attempt.quizzes?.title || 'Unknown quiz'}" (${attempt.score_percentage}%)`,
          timestamp: attempt.completed_at,
          user_name: attempt.profiles?.full_name,
          badge_color: attempt.passed ? 'bg-emerald-500' : 'bg-yellow-500',
        })
      })
    }

    // Recent content creation
    if (coursesResult.data) {
      coursesResult.data.forEach((course: any) => {
        activities.push({
          id: `course-${course.created_at}`,
          type: 'content_created',
          title: 'New course created',
          description: `Course "${course.title}" was created`,
          timestamp: course.created_at,
          badge_color: 'bg-purple-500',
        })
      })
    }

    if (lessonsResult.data) {
      lessonsResult.data.forEach((lesson: any) => {
        activities.push({
          id: `lesson-${lesson.created_at}`,
          type: 'content_created',
          title: 'New lesson created',
          description: `Lesson "${lesson.title}" was created`,
          timestamp: lesson.created_at,
          badge_color: 'bg-indigo-500',
        })
      })
    }

    // Sort activities by timestamp and take the 10 most recent
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const recentActivities = activities.slice(0, 10)

    // Get basic stats
    const [
      totalStudentsResult,
      totalCoursesResult,
      publishedCoursesResult,
      totalLessonsResult,
      totalQuizzesResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    ])

    const stats = {
      totalStudents: totalStudentsResult.count || 0,
      totalCourses: totalCoursesResult.count || 0,
      publishedCourses: publishedCoursesResult.count || 0,
      totalLessons: totalLessonsResult.count || 0,
      totalQuizzes: totalQuizzesResult.count || 0,
    }

    return NextResponse.json({
      success: true,
      recentActivities,
      stats,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
