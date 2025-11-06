import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Course = Pick<Database['public']['Tables']['courses']['Row'], 'id' | 'title' | 'created_at'>
type Lesson = Pick<Database['public']['Tables']['lessons']['Row'], 'id' | 'title' | 'created_at'>
type Student = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>

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

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch analytics data
    const [coursesResult, lessonsResult, studentsResult] = await Promise.all([
      supabase.from('courses').select('id, title, created_at'),
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

    const courses = (coursesResult.data || []) as Course[]
    const lessons = (lessonsResult.data || []) as Lesson[]
    const students = (studentsResult.data || []) as Student[]

    // Calculate overview statistics
    const totalCourses = courses.length
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
