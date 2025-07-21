import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using profiles table (more reliable)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch analytics data
    const [coursesResult, lessonsResult, studentsResult] = await Promise.all([
      supabase.from('courses').select('id, title, status, created_at'),
      supabase.from('lessons').select('id, title, created_at'),
      supabase.from('profiles').select('id, created_at').eq('role', 'student'),
    ])

    if (coursesResult.error || lessonsResult.error || studentsResult.error) {
      console.error(
        'Database error:',
        coursesResult.error || lessonsResult.error || studentsResult.error
      )
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const courses = coursesResult.data || []
    const lessons = lessonsResult.data || []
    const students = studentsResult.data || []

    // Calculate overview statistics
    const totalCourses = courses.length
    const publishedCourses = courses.filter(
      c => c.status === 'published'
    ).length
    const draftCourses = courses.filter(c => c.status === 'draft').length
    const totalLessons = lessons.length
    const totalQuizzes = 0 // Will be calculated when needed
    const totalStudents = students.length

    // Calculate recent activity (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoISO = weekAgo.toISOString()

    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthAgoISO = monthAgo.toISOString()

    const coursesThisWeek = courses.filter(
      c => c.created_at && c.created_at >= weekAgoISO
    ).length
    const lessonsThisWeek = lessons.filter(
      l => l.created_at && l.created_at >= weekAgoISO
    ).length
    const studentsThisWeek = students.filter(
      s => s.created_at && s.created_at >= weekAgoISO
    ).length

    const coursesThisMonth = courses.filter(
      c => c.created_at && c.created_at >= monthAgoISO
    ).length
    const lessonsThisMonth = lessons.filter(
      l => l.created_at && l.created_at >= monthAgoISO
    ).length
    const studentsThisMonth = students.filter(
      s => s.created_at && s.created_at >= monthAgoISO
    ).length

    const analytics = {
      overview: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalLessons,
        totalQuizzes,
        totalStudents,
      },
      recent: {
        coursesThisWeek,
        lessonsThisWeek,
        quizzesThisWeek: 0,
        studentsThisWeek,
        coursesThisMonth,
        lessonsThisMonth,
        quizzesThisMonth: 0,
        studentsThisMonth,
      },
      trends: {
        courses: courses.map(c => ({
          id: c.id,
          created_at: c.created_at || '',
          status: c.status || 'draft',
        })),
        students: students.map(s => ({
          id: s.id,
          created_at: s.created_at || '',
        })),
      },
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
