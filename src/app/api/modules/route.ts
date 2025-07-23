import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch all published modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')
      .order('order', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    if (!modules || modules.length === 0) {
      return NextResponse.json({
        success: true,
        modules: [],
      })
    }

    // Fetch all courses for these modules (show all assigned courses regardless of status)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in(
        'module_id',
        modules.map(m => m.id)
      )
      .not('module_id', 'is', null) // Only show courses that are assigned to modules
      .order('order', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Fetch all lessons for these courses
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('course_id', courses?.map(c => c.id) || [])
      .order('order', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    // Fetch all quizzes for these courses
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('*')
      .in('course_id', courses?.map(c => c.id) || [])

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Build the hierarchical structure
    const modulesWithCourses = modules.map(module => {
      const moduleCourses =
        courses?.filter(course => course.module_id === module.id) || []

      const coursesWithContent = moduleCourses.map(course => {
        const courseLessons =
          lessons?.filter(lesson => lesson.course_id === course.id) || []
        const courseQuizzes =
          quizzes?.filter(quiz => quiz.course_id === course.id) || []

        return {
          ...course,
          lessons: courseLessons,
          quizzes: courseQuizzes,
        }
      })

      return {
        ...module,
        courses: coursesWithContent,
      }
    })

    return NextResponse.json({
      success: true,
      modules: modulesWithCourses,
    })
  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
