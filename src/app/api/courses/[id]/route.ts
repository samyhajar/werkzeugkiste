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

    // Fetch course-level quizzes (directly associated with course)
    const { data: courseQuizzes, error: courseQuizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', id)

    // Fetch lesson-specific quizzes (associated with lessons in this course)
    const lessonIds = lessons?.map(l => l.id) || []
    let lessonQuizzes = []
    if (lessonIds.length > 0) {
      const { data: lessonQuizzesData, error: lessonQuizzesError } =
        await supabase.from('quizzes').select('*').in('lesson_id', lessonIds)

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
