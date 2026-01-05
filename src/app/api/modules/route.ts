import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'
import { NextRequest, NextResponse } from 'next/server'

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
            'Cache-Control': 'no-store',
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
      // Ensure stable ordering inside each module.
      .order('module_id', { ascending: true })
      .order('order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })

    const coursesData = (courses || []) as Course[]

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
      .in(
        'course_id',
        coursesData.map(c => c.id)
      )
      .order('order', { ascending: true })

    const lessonsData = (lessons || []) as Lesson[]

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
      .in(
        'course_id',
        coursesData.map(c => c.id)
      )
      .eq('scope', 'course')
      .order('sort_order', { ascending: true })

    const quizzesData = (quizzes || []) as any[]

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    // Build the hierarchical structure
    const modulesWithCourses = modulesData.map((module: Module) => {
      const moduleCourses = coursesData.filter(
        course => course.module_id === module.id
      )

      const getCourseSortKey = (course: Course) => {
        const raw = course.order
        // Put null/undefined orders at the end.
        return typeof raw === 'number' ? raw : Number.MAX_SAFE_INTEGER
      }

      const sortedModuleCourses = [...moduleCourses].sort((a, b) => {
        const diff = getCourseSortKey(a) - getCourseSortKey(b)
        if (diff !== 0) return diff
        return a.id.localeCompare(b.id)
      })

      const coursesWithContent = sortedModuleCourses.map((course: Course) => {
        const courseLessons = lessonsData.filter(
          lesson => lesson.course_id === course.id
        )
        const courseQuizzes = quizzesData.filter(
          (quiz: any) => quiz.course_id === course.id
        )

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
          'Cache-Control': 'no-store',
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
