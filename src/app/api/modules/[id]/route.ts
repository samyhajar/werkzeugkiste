import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user (optional for public modules, but good for progress tracking)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch module details
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Fetch courses for this module
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('module_id', id)
      .order('order', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // For each course, fetch its lessons and quizzes
    const coursesWithContent = await Promise.all(
      (courses || []).map(async course => {
        // Fetch lessons for this course
        const { data: lessons, error: _lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('order', { ascending: true })

        // Fetch course-level quizzes from enhanced_quizzes table
        const { data: courseQuizzes, error: _courseQuizzesError } =
          await supabase
            .from('enhanced_quizzes')
            .select('*')
            .eq('course_id', course.id)
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

          if (!lessonQuizzesError) {
            lessonQuizzes = lessonQuizzesData || []
          }
        }

        // Combine all quizzes
        const allQuizzes = [...(courseQuizzes || []), ...lessonQuizzes]

        return {
          ...course,
          lessons: lessons || [],
          quizzes: allQuizzes,
        }
      })
    )

    // Combine module with its courses
    const moduleWithContent = {
      ...module,
      courses: coursesWithContent,
    }

    return NextResponse.json({
      success: true,
      module: moduleWithContent,
    })
  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
