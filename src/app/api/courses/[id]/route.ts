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
      data: { user: _user },
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

    // Fetch course-level quizzes from enhanced_quizzes table
    const { data: courseQuizzes, error: courseQuizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('*')
      .eq('course_id', id)
      .eq('scope', 'course')
      .order('sort_order', { ascending: true })

    // Fetch lesson-specific quizzes from enhanced_quizzes table
    const lessonIds = lessons?.map(l => l.id) || []
    let lessonQuizzes: any[] = []
    if (lessonIds.length > 0) {
      const { data: lessonQuizzesData, error: lessonQuizzesError } =
        await supabase
          .from('enhanced_quizzes')
          .select('*')
          .in('lesson_id', lessonIds)
          .eq('scope', 'lesson')
          .order('sort_order', { ascending: true })

      if (lessonQuizzesError) {
        console.error('Error fetching lesson quizzes:', lessonQuizzesError)
      } else {
        lessonQuizzes = lessonQuizzesData || []
      }
    }

    if (courseQuizzesError) {
      console.error('Error fetching course quizzes:', courseQuizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Combine all quizzes
    const allQuizzes = [...(courseQuizzes || []), ...lessonQuizzes]

    // Combine course with its lessons and quizzes
    const courseWithContent = {
      ...course,
      lessons: lessons || [],
      quizzes: allQuizzes,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete course (lessons will remain due to warning given to user)
    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    console.error('Delete course API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
