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

    // Fetch analytics data
    const [coursesResult, lessonsResult, quizzesResult, studentsResult] =
      await Promise.all([
        supabase
          .from('courses')
          .select('id, status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('lessons')
          .select('id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('quizzes')
          .select('id, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, role, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false }),
      ])

    if (coursesResult.error) {
      console.error('Error fetching courses:', coursesResult.error)
      return NextResponse.json(
        { error: coursesResult.error.message },
        { status: 500 }
      )
    }

    if (lessonsResult.error) {
      console.error('Error fetching lessons:', lessonsResult.error)
      return NextResponse.json(
        { error: lessonsResult.error.message },
        { status: 500 }
      )
    }

    if (quizzesResult.error) {
      console.error('Error fetching quizzes:', quizzesResult.error)
      return NextResponse.json(
        { error: quizzesResult.error.message },
        { status: 500 }
      )
    }

    if (studentsResult.error) {
      console.error('Error fetching students:', studentsResult.error)
      return NextResponse.json(
        { error: studentsResult.error.message },
        { status: 500 }
      )
    }

    const courses = coursesResult.data || []
    const lessons = lessonsResult.data || []
    const quizzes = quizzesResult.data || []
    const students = studentsResult.data || []

    // Calculate analytics
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const analytics = {
      overview: {
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.status === 'published').length,
        draftCourses: courses.filter(c => c.status === 'draft').length,
        totalLessons: lessons.length,
        totalQuizzes: quizzes.length,
        totalStudents: students.length,
      },
      recent: {
        coursesThisWeek: courses.filter(
          c => c.created_at && new Date(c.created_at) > weekAgo
        ).length,
        lessonsThisWeek: lessons.filter(
          l => l.created_at && new Date(l.created_at) > weekAgo
        ).length,
        quizzesThisWeek: quizzes.filter(
          q => q.created_at && new Date(q.created_at) > weekAgo
        ).length,
        studentsThisWeek: students.filter(
          s => s.created_at && new Date(s.created_at) > weekAgo
        ).length,
        coursesThisMonth: courses.filter(
          c => c.created_at && new Date(c.created_at) > monthAgo
        ).length,
        lessonsThisMonth: lessons.filter(
          l => l.created_at && new Date(l.created_at) > monthAgo
        ).length,
        quizzesThisMonth: quizzes.filter(
          q => q.created_at && new Date(q.created_at) > monthAgo
        ).length,
        studentsThisMonth: students.filter(
          s => s.created_at && new Date(s.created_at) > monthAgo
        ).length,
      },
      trends: {
        courses: courses.slice(0, 10),
        students: students.slice(0, 10),
      },
    }

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
