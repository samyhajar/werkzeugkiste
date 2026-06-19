import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type CourseRow = Database['public']['Tables']['courses']['Row']
type LessonRow = Database['public']['Tables']['lessons']['Row']
type ModuleRow = Database['public']['Tables']['modules']['Row']

export class ModulePdfNotFoundError extends Error {
  constructor(moduleId: string) {
    super(`Module not found: ${moduleId}`)
    this.name = 'ModulePdfNotFoundError'
  }
}

export type ModulePdfCourse = CourseRow & {
  lessons: LessonRow[]
}

export type ModulePdfData = ModuleRow & {
  courses: ModulePdfCourse[]
}

const getOrderValue = (...values: Array<number | null | undefined>) => {
  const value = values.find(item => typeof item === 'number')
  return typeof value === 'number' ? value : Number.MAX_SAFE_INTEGER
}

export async function getPublicModulePdfData(
  moduleId: string
): Promise<ModulePdfData> {
  const supabase = await createClient()

  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  const moduleData = module as ModuleRow | null

  if (moduleError || !moduleData) {
    throw new ModulePdfNotFoundError(moduleId)
  }

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('module_id', moduleId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })

  if (coursesError) {
    throw new Error(`Failed to fetch module courses: ${coursesError.message}`)
  }

  const coursesData = ((courses || []) as CourseRow[]).sort((a, b) => {
    const diff = getOrderValue(a.order) - getOrderValue(b.order)
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })

  const courseIds = coursesData.map(course => course.id)
  let lessonsData: LessonRow[] = []

  if (courseIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('course_id', courseIds)
      .order('course_id', { ascending: true })
      .order('order', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })

    if (lessonsError) {
      throw new Error(`Failed to fetch module lessons: ${lessonsError.message}`)
    }

    lessonsData = ((lessons || []) as LessonRow[]).sort((a, b) => {
      const aOrder = getOrderValue(a.order, a.sort_order)
      const bOrder = getOrderValue(b.order, b.sort_order)
      const diff = aOrder - bOrder
      if (diff !== 0) return diff
      return a.id.localeCompare(b.id)
    })
  }

  const coursesWithLessons = coursesData.map(course => ({
    ...course,
    lessons: lessonsData.filter(lesson => lesson.course_id === course.id),
  }))

  return {
    ...moduleData,
    courses: coursesWithLessons,
  }
}
