import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
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

    // Fetch all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('order', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('order', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Fetch all lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .order('sort_order', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    // Fetch all quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: true })

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Build the complete structure elements
    const elements: any[] = []

    // Add modules as top-level elements
    modules?.forEach((module: any, moduleIndex: number) => {
      elements.push({
        id: `module-${module.id}`,
        type: 'module',
        title: module.title,
        description: module.description,
        order: moduleIndex, // Use index since modules table doesn't have order field
        parent_id: null,
        children: [],
        isExpanded: true,
        db_id: module.id,
        db_type: 'modules',
      })

      // Add courses for this module
      const moduleCourses =
        courses?.filter((course: any) => course.module_id === module.id) || []
      moduleCourses.forEach((course: any, courseIndex: number) => {
        elements.push({
          id: `course-${course.id}`,
          type: 'course',
          title: course.title,
          description: course.description,
          order: courseIndex,
          parent_id: `module-${module.id}`,
          children: [],
          isExpanded: true,
          db_id: course.id,
          db_type: 'courses',
        })

        // Add lessons for this course
        const courseLessons =
          lessons?.filter((lesson: any) => lesson.course_id === course.id) || []
        courseLessons.forEach((lesson: any, lessonIndex: number) => {
          elements.push({
            id: `lesson-${lesson.id}`,
            type: 'lesson',
            title: lesson.title,
            description: lesson.content || lesson.markdown || '', // Use content or markdown as description
            order: lesson.sort_order || lessonIndex,
            parent_id: `course-${course.id}`,
            children: [],
            isExpanded: false,
            db_id: lesson.id,
            db_type: 'lessons',
          })
        })

        // Add quizzes for this course
        const courseQuizzes =
          quizzes?.filter((quiz: any) => quiz.course_id === course.id) || []
        courseQuizzes.forEach((quiz: any, quizIndex: number) => {
          elements.push({
            id: `quiz-${quiz.id}`,
            type: 'quiz',
            title: quiz.title,
            description: quiz.description || '',
            order: quizIndex,
            parent_id: `course-${course.id}`,
            children: [],
            isExpanded: false,
            db_id: quiz.id,
            db_type: 'quizzes',
          })
        })
      })
    })

    return NextResponse.json({
      success: true,
      elements,
    })
  } catch (error) {
    console.error('Error in structure API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Update order for courses
    const courseUpdates = elements
      .filter((el: any) => el.db_type === 'courses')
      .map((el: any, index: number) => ({
        id: el.db_id,
        order: index,
      }))

    if (courseUpdates.length > 0) {
      for (const update of courseUpdates) {
        const { error } = await supabase
          .from('courses')
          .update({ order: update.order } as any)
          .eq('id', update.id)

        if (error) {
          console.error('Error updating course order:', error)
        }
      }
    }

    // Note: Modules table doesn't have an order field, so we skip updating module order
    // The modules will maintain their creation order

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating structure:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
