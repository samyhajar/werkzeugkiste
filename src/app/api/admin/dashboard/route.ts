import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

type LessonActivity = {
  lesson_id: string
  student_id: string
  completed_at: string | null
  profiles: { full_name: string | null } | null
  lessons: { title: string } | null
}

type QuizActivity = {
  quiz_id: string
  user_id: string
  completed_at: string | null
  passed: boolean | null
  profiles: { full_name: string | null } | null
  quizzes: { title: string; pass_percentage: number | null } | null
}

interface RecentActivity {
  id: string
  timestamp: string
  type: 'lesson_completed' | 'quiz_completed' | 'course_completed'
  studentName: string
}

interface DashboardStats {
  totalCourses: number
  totalLessons: number
  totalQuizzes: number
  totalStudents: number
  recentActivities: RecentActivity[]
}

interface DashboardResponse {
  success: boolean
  stats?: DashboardStats
  recentActivities?: RecentActivity[]
  error?: string
}

export async function GET(
  _request: NextRequest
): Promise<NextResponse<DashboardResponse>> {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin using profiles table (more reliable)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get dashboard statistics
    const [coursesResult, lessonsResult, studentsResult] = await Promise.all([
      supabase.from('courses').select('id'),
      supabase.from('lessons').select('id'),
      supabase.from('profiles').select('id').eq('role', 'student'),
    ])

    if (coursesResult.error || lessonsResult.error || studentsResult.error) {
      console.error(
        'Database error:',
        coursesResult.error || lessonsResult.error || studentsResult.error
      )
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      )
    }

    // Get recent activities - lessons completed
    const { data: lessonActivities } = await supabase
      .from('lesson_progress')
      .select(
        `
        lesson_id,
        student_id,
        completed_at,
        profiles!student_id (
          full_name
        ),
        lessons (
          title
        )
      `
      )
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20)

    // Get recent activities - quizzes completed
    const { data: quizActivities } = await supabase
      .from('quiz_attempts')
      .select(
        `
        quiz_id,
        user_id,
        completed_at,
        passed,
        profiles!user_id (
          full_name
        ),
        quizzes (
          title,
          pass_percentage
        )
      `
      )
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20)

    // Process lesson activities
    const processedLessonActivities: RecentActivity[] = (
      (lessonActivities || []) as LessonActivity[]
    ).map(activity => ({
      id: `lesson-${activity.lesson_id}-${activity.student_id}`,
      timestamp: activity.completed_at || '',
      type: 'lesson_completed' as const,
      studentName: activity.profiles?.full_name || 'Unknown Student',
    }))

    // Process quiz activities
    const processedQuizActivities: RecentActivity[] = (
      (quizActivities || []) as QuizActivity[]
    ).map(activity => ({
      id: `quiz-${activity.quiz_id}-${activity.user_id}`,
      timestamp: activity.completed_at || '',
      type: 'quiz_completed' as const,
      studentName: activity.profiles?.full_name || 'Unknown Student',
    }))

    // Combine and sort all activities
    const allActivities = [
      ...processedLessonActivities,
      ...processedQuizActivities,
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10)

    const stats: DashboardStats = {
      totalCourses: coursesResult.data?.length || 0,
      totalLessons: lessonsResult.data?.length || 0,
      totalQuizzes: 0, // Will be populated when needed
      totalStudents: studentsResult.data?.length || 0,
      recentActivities: allActivities,
    }

    return NextResponse.json({
      success: true,
      stats,
      recentActivities: allActivities,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
