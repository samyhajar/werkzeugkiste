import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Module = Database['public']['Tables']['modules']['Row']
type Course = Database['public']['Tables']['courses']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch all modules (status column was removed)
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('order', { ascending: true })

    const modulesData = (modules || []) as Module[]

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    if (!modulesData || modulesData.length === 0) {
      return NextResponse.json(
        {
          success: true,
          modules: [],
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            Vary: 'Accept-Encoding',
          },
        }
      )
    }

    // Fetch all courses for these modules (show all assigned courses regardless of status)
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in(
        'module_id',
        modulesData.map(m => m.id)
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
      .in('course_id', (courses || [] as Course[]).map((c: Course) => c.id))
      .order('order', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    // Fetch all quizzes for these courses from enhanced_quizzes table
    const { data: quizzes, error: quizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('*')
      .in('course_id', (courses || [] as Course[]).map((c: Course) => c.id))
      .eq('scope', 'course')
      .order('sort_order', { ascending: true })

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Build the hierarchical structure
    const modulesWithCourses = modulesData.map((module: Module) => {
      const moduleCourses =
        (courses || [] as Course[]).filter((course: Course) => course.module_id === module.id)

      const coursesWithContent = moduleCourses.map((course: Course) => {
        const courseLessons =
          (lessons || [] as Lesson[]).filter((lesson: Lesson) => lesson.course_id === course.id)
        const courseQuizzes =
          (quizzes || [] as any[]).filter((quiz: any) => quiz.course_id === course.id)

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

    return NextResponse.json(
      {
        success: true,
        modules: modulesWithCourses,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          Vary: 'Accept-Encoding',
        },
      }
    )
  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
