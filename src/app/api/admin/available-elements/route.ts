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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin using profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch unassigned courses (courses without module_id)
    const { data: unassignedCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .is('module_id', null)
      .order('created_at', { ascending: true })

    if (coursesError) {
      console.error('Error fetching unassigned courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch unassigned courses' },
        { status: 500 }
      )
    }

    // Fetch unassigned lessons (lessons without course_id)
    const { data: unassignedLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .is('course_id', null)
      .order('created_at', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching unassigned lessons:', lessonsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch unassigned lessons' },
        { status: 500 }
      )
    }

    // Fetch unassigned quizzes (enhanced_quizzes without course_id)
    const { data: unassignedQuizzes, error: quizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('*')
      .is('course_id', null)
      .order('created_at', { ascending: true })

    if (quizzesError) {
      console.error('Error fetching unassigned quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch unassigned quizzes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      unassignedCourses: unassignedCourses || [],
      unassignedLessons: unassignedLessons || [],
      unassignedQuizzes: unassignedQuizzes || [],
    })
  } catch (error) {
    console.error('Error in available elements API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
