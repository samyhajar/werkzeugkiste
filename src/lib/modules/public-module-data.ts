import { Tables } from '@/types/supabase'
import { createPublicContentClient } from '@/lib/supabase/public-content-client'

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
  return typeof course.order === 'number'
    ? course.order
    : Number.MAX_SAFE_INTEGER
}

function getLessonSortKey(lesson: Lesson) {
  const order =
    typeof lesson.order === 'number' ? lesson.order : lesson.sort_order

  return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER
}

function getModuleSortKey(moduleItem: Module) {
  return typeof moduleItem.order === 'number'
    ? moduleItem.order
    : Number.MAX_SAFE_INTEGER
}

function getQuizSortKey(quiz: Quiz) {
  return typeof quiz.sort_order === 'number'
    ? quiz.sort_order
    : Number.MAX_SAFE_INTEGER
}

function sortByNumericKeyAndId<T extends { id: string }>(
  items: T[],
  getSortKey: (item: T) => number
) {
  return [...items].sort((a, b) => {
    const diff = getSortKey(a) - getSortKey(b)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
}

export async function loadPublicModuleById(
  id: string
): Promise<PublicModule | null> {
  const supabase = createPublicContentClient()

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

  if (coursesError) {
    throw coursesError
  }

  const coursesData = sortByNumericKeyAndId(
    (courses || []) as Course[],
    getCourseSortKey
  )
  const courseIds = coursesData.map(course => course.id)

  let lessonsData: Lesson[] = []
  let quizzesData: Quiz[] = []

  if (courseIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('course_id', courseIds)

    if (lessonsError) {
      throw lessonsError
    }

    lessonsData = sortByNumericKeyAndId(
      (lessons || []) as Lesson[],
      getLessonSortKey
    )
    const lessonIds = lessonsData.map(lesson => lesson.id)
    const quizQueries = [
      supabase
        .from('enhanced_quizzes')
        .select('*')
        .in('course_id', courseIds)
        .eq('scope', 'course'),
    ]

    if (lessonIds.length > 0) {
      quizQueries.push(
        supabase
          .from('enhanced_quizzes')
          .select('*')
          .in('lesson_id', lessonIds)
          .eq('scope', 'lesson')
      )
    }

    const quizResults = await Promise.all(quizQueries)

    for (const result of quizResults) {
      if (result.error) {
        console.warn(
          '[public-module-data] Failed to fetch public quizzes:',
          result.error
        )
        continue
      }

      quizzesData.push(...((result.data || []) as Quiz[]))
    }

    quizzesData = sortByNumericKeyAndId(quizzesData, getQuizSortKey)
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

  const moduleCourses = sortByNumericKeyAndId(coursesData, getCourseSortKey)

  return {
    ...moduleData,
    courses: moduleCourses.map(course => ({
      ...course,
      lessons: sortByNumericKeyAndId(
        lessonsByCourse.get(course.id) || [],
        getLessonSortKey
      ),
      quizzes: sortByNumericKeyAndId(
        quizzesByCourse.get(course.id) || [],
        getQuizSortKey
      ),
    })),
  }
}

export async function loadPublicModules(): Promise<PublicModule[]> {
  const supabase = createPublicContentClient()

  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*')

  if (modulesError) {
    throw modulesError
  }

  const modulesData = sortByNumericKeyAndId(
    (modules || []) as Module[],
    getModuleSortKey
  )
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

  if (coursesError) {
    throw coursesError
  }

  const coursesData = sortByNumericKeyAndId(
    (courses || []) as Course[],
    getCourseSortKey
  )
  const courseIds = coursesData.map(course => course.id)

  let lessonsData: Lesson[] = []
  let quizzesData: Quiz[] = []

  if (courseIds.length > 0) {
    const [
      { data: lessons, error: lessonsError },
      { data: quizzes, error: quizzesError },
    ] = await Promise.all([
      supabase.from('lessons').select('*').in('course_id', courseIds),
      supabase
        .from('enhanced_quizzes')
        .select('*')
        .in('course_id', courseIds)
        .eq('scope', 'course'),
    ])

    if (lessonsError) {
      throw lessonsError
    }

    if (quizzesError) {
      console.warn(
        '[public-module-data] Failed to fetch public module quizzes:',
        quizzesError
      )
    }

    lessonsData = sortByNumericKeyAndId(
      (lessons || []) as Lesson[],
      getLessonSortKey
    )
    quizzesData = sortByNumericKeyAndId(
      (quizzes || []) as Quiz[],
      getQuizSortKey
    )
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
    const moduleCourses = sortByNumericKeyAndId(
      coursesByModule.get(moduleItem.id) || [],
      getCourseSortKey
    )

    return {
      ...moduleItem,
      courses: moduleCourses.map(course => ({
        ...course,
        lessons: sortByNumericKeyAndId(
          lessonsByCourse.get(course.id) || [],
          getLessonSortKey
        ),
        quizzes: sortByNumericKeyAndId(
          quizzesByCourse.get(course.id) || [],
          getQuizSortKey
        ),
      })),
    }
  })
}
