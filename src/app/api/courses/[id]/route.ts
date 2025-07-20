import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user (optional for public courses, but good for progress tracking)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('status', 'published') // Only allow access to published courses
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', id)
      .order('sort_order', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    // Fetch quizzes for this course
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', null) // Course-level quizzes
      .in('lesson_id', lessons?.map(l => l.id) || []) // OR lesson-specific quizzes

    // Actually, let's get quizzes that belong to lessons in this course
    const { data: courseQuizzes, error: courseQuizzesError } = await supabase
      .from('quizzes')
      .select(
        `
        *,
        lessons!inner(course_id)
      `
      )
      .eq('lessons.course_id', id)

    if (courseQuizzesError) {
      console.error('Error fetching quizzes:', courseQuizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Combine course with its lessons and quizzes
    const courseWithContent = {
      ...course,
      lessons: lessons || [],
      quizzes: courseQuizzes || [],
    }

    return NextResponse.json({
      success: true,
      course: courseWithContent,
    })
  } catch (error) {
    console.error('Course API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
