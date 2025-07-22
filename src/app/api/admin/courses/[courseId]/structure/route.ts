import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { courseId } = await params

    // Fetch course with its module
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(
        `
        *,
        modules (*)
      `
      )
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course:', courseError)
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Fetch lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
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
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Build the structure elements
    const elements = []

    // Add module as the main container
    if (course.modules) {
      elements.push({
        id: `module-${course.modules.id}`,
        type: 'module',
        title: course.modules.title,
        description: course.modules.description,
        order: 0,
        parent_id: null,
        children: [],
        isExpanded: true,
        db_id: course.modules.id,
        db_type: 'modules',
      })
    }

    // Add lessons
    lessons?.forEach((lesson: any, index: number) => {
      elements.push({
        id: `lesson-${lesson.id}`,
        type: 'lesson',
        title: lesson.title,
        description: lesson.description,
        order: lesson.sort_order || index,
        parent_id: `module-${course.modules?.id}`,
        children: [],
        isExpanded: false,
        db_id: lesson.id,
        db_type: 'lessons',
      })
    })

    // Add quizzes
    quizzes?.forEach((quiz: any, index: number) => {
      elements.push({
        id: `quiz-${quiz.id}`,
        type: 'quiz',
        title: quiz.title,
        description: quiz.description,
        order: quiz.order || index,
        parent_id: `module-${course.modules?.id}`,
        children: [],
        isExpanded: false,
        db_id: quiz.id,
        db_type: 'quizzes',
      })
    })

    return NextResponse.json({
      success: true,
      elements,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        module_id: course.module_id,
      },
    })
  } catch (error) {
    console.error('Error in course structure API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { courseId } = await params
    const { elements } = await request.json()

    // Update order for lessons
    const lessonUpdates = elements
      .filter((el: any) => el.db_type === 'lessons')
      .map((el: any, index: number) => ({
        id: el.db_id,
        sort_order: index,
      }))

    if (lessonUpdates.length > 0) {
      for (const update of lessonUpdates) {
        const { error } = await supabase
          .from('lessons')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating lesson order:', error)
        }
      }
    }

    // Note: Quizzes table doesn't have an order field, so we skip updating quiz order
    // The quizzes will maintain their creation order

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating course structure:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
