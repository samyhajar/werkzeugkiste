import { Tables } from '@/types/supabase'
import { createPublicClient } from '@/lib/supabase/public-client'

type Module = Tables<'modules'>
type Course = Tables<'courses'>
type Lesson = Tables<'lessons'>
type Quiz = Tables<'enhanced_quizzes'>

export type PublicModule = Module & {
  courses: (Course & {
    lessons: Lesson[]
    quizzes: Quiz[]
  })[]
}

function getCourseSortKey(course: Course) {
  return typeof course.order === 'number' ? course.order : Number.MAX_SAFE_INTEGER
}

export async function loadPublicModuleById(
  id: string
): Promise<PublicModule | null> {
  const supabase = createPublicClient()

  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (moduleError) {
    throw moduleError
  }

  const moduleData = module as Module | null
  if (!moduleData) {
    return null
  }

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('module_id', id)
    .order('order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (coursesError) {
    throw coursesError
  }

  const coursesData = (courses || []) as Course[]
  const courseIds = coursesData.map(course => course.id)

  let lessonsData: Lesson[] = []
  let quizzesData: Quiz[] = []

  if (courseIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('course_id', courseIds)
      .order('order', { ascending: true })

    if (lessonsError) {
      throw lessonsError
    }

    lessonsData = (lessons || []) as Lesson[]
    const lessonIds = lessonsData.map(lesson => lesson.id)
    const quizQueries = [
      supabase
        .from('enhanced_quizzes')
        .select('*')
        .in('course_id', courseIds)
        .eq('scope', 'course')
        .order('sort_order', { ascending: true }),
    ]

    if (lessonIds.length > 0) {
      quizQueries.push(
        supabase
          .from('enhanced_quizzes')
          .select('*')
          .in('lesson_id', lessonIds)
          .eq('scope', 'lesson')
          .order('sort_order', { ascending: true })
      )
    }

    const quizResults = await Promise.all(quizQueries)

    for (const result of quizResults) {
      if (result.error) {
        throw result.error
      }

      quizzesData.push(...((result.data || []) as Quiz[]))
    }
  }

  const lessonsByCourse = new Map<string, Lesson[]>()
  for (const lesson of lessonsData) {
    if (!lesson.course_id) continue
    const existingLessons = lessonsByCourse.get(lesson.course_id) || []
    existingLessons.push(lesson)
    lessonsByCourse.set(lesson.course_id, existingLessons)
  }

  const quizzesByCourse = new Map<string, Quiz[]>()
  for (const quiz of quizzesData) {
    if (!quiz.course_id) continue
    const existingQuizzes = quizzesByCourse.get(quiz.course_id) || []
    existingQuizzes.push(quiz)
    quizzesByCourse.set(quiz.course_id, existingQuizzes)
  }

  const moduleCourses = [...coursesData].sort((a, b) => {
    const diff = getCourseSortKey(a) - getCourseSortKey(b)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })

  return {
    ...moduleData,
    courses: moduleCourses.map(course => ({
      ...course,
      lessons: lessonsByCourse.get(course.id) || [],
      quizzes: quizzesByCourse.get(course.id) || [],
    })),
  }
}

export async function loadPublicModules(): Promise<PublicModule[]> {
  const supabase = createPublicClient()

  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')
    .order('order', { ascending: true })

  if (modulesError) {
    throw modulesError
  }

  const modulesData = (modules || []) as Module[]
  if (modulesData.length === 0) {
    return []
  }

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .in(
      'module_id',
      modulesData.map(moduleItem => moduleItem.id)
    )
    .not('module_id', 'is', null)
    .order('module_id', { ascending: true })
    .order('order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (coursesError) {
    throw coursesError
  }

  const coursesData = (courses || []) as Course[]
  const courseIds = coursesData.map(course => course.id)

  let lessonsData: Lesson[] = []
  let quizzesData: Quiz[] = []

  if (courseIds.length > 0) {
    const [
      { data: lessons, error: lessonsError },
      { data: quizzes, error: quizzesError },
    ] = await Promise.all([
      supabase
        .from('lessons')
        .select('*')
        .in('course_id', courseIds)
        .order('order', { ascending: true }),
      supabase
        .from('enhanced_quizzes')
        .select('*')
        .in('course_id', courseIds)
        .eq('scope', 'course')
        .order('sort_order', { ascending: true }),
    ])

    if (lessonsError) {
      throw lessonsError
    }

    if (quizzesError) {
      throw quizzesError
    }

    lessonsData = (lessons || []) as Lesson[]
    quizzesData = (quizzes || []) as Quiz[]
  }

  const lessonsByCourse = new Map<string, Lesson[]>()
  for (const lesson of lessonsData) {
    if (!lesson.course_id) continue
    const existingLessons = lessonsByCourse.get(lesson.course_id) || []
    existingLessons.push(lesson)
    lessonsByCourse.set(lesson.course_id, existingLessons)
  }

  const quizzesByCourse = new Map<string, Quiz[]>()
  for (const quiz of quizzesData) {
    if (!quiz.course_id) continue
    const existingQuizzes = quizzesByCourse.get(quiz.course_id) || []
    existingQuizzes.push(quiz)
    quizzesByCourse.set(quiz.course_id, existingQuizzes)
  }

  const coursesByModule = new Map<string, Course[]>()
  for (const course of coursesData) {
    if (!course.module_id) continue
    const existingCourses = coursesByModule.get(course.module_id) || []
    existingCourses.push(course)
    coursesByModule.set(course.module_id, existingCourses)
  }

  return modulesData.map(moduleItem => {
    const moduleCourses = [...(coursesByModule.get(moduleItem.id) || [])].sort(
      (a, b) => {
        const diff = getCourseSortKey(a) - getCourseSortKey(b)
        if (diff !== 0) return diff
        return a.id.localeCompare(b.id)
      }
    )

    return {
      ...moduleItem,
      courses: moduleCourses.map(course => ({
        ...course,
        lessons: lessonsByCourse.get(course.id) || [],
        quizzes: quizzesByCourse.get(course.id) || [],
      })),
    }
  })
}
