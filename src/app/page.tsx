import LiveModulesSection from '@/components/shared/LiveModulesSection'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server-client'
import { Tables } from '@/types/supabase'
import { redirect } from 'next/navigation'
import PartnerSection from '@/components/shared/PartnerSection'
import { Suspense } from 'react'
// import { cookies } from 'next/headers'


type Lesson = Tables<'lessons'>

interface ProgressData {
  lesson_id: string
  completed_at: string | null
  lessons: {
    id: string
    course_id: string | null
    title: string | null
  }
}

export const revalidate = 60 // ISR every minute

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = await createClient()

  // Get current user session
  // const cookieStore = await cookies()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all published modules with their courses
  const { data: fetchedModules } = await supabase
    .from('modules')
    .select('*')
    .eq('status', 'published')
    .order('order', { ascending: true })

  const modules = fetchedModules ?? []

  // Fetch all courses for these modules (show all assigned courses regardless of status)
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .in('module_id', modules.map(m => m.id))
    .not('module_id', 'is', null) // Only show courses that are assigned to modules
    .order('order', { ascending: true })

  // Fetch all lessons for these courses
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .in('course_id', courses?.map(c => c.id) || [])
    .order('order', { ascending: true })

  // Fetch all quizzes for these courses
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .in('course_id', courses?.map(c => c.id) || [])

  // Build the hierarchical structure
  const modulesWithCourses = modules.map(module => {
    const moduleCourses = courses?.filter(course => course.module_id === module.id) || []

    const coursesWithContent = moduleCourses.map(course => {
      const courseLessons = lessons?.filter(lesson => lesson.course_id === course.id) || []
      const courseQuizzes = quizzes?.filter(quiz => quiz.course_id === course.id) || []

      return {
        ...course,
        lessons: courseLessons,
        quizzes: courseQuizzes
      }
    })

    return {
      ...module,
      courses: coursesWithContent
    }
  })

  // Fetch user progress if logged in
  const userProgress: Record<string, number> = {}
  if (user && modules.length > 0) {
    // Get all courses for these modules
    const { data: courses } = await supabase
      .from('courses')
      .select('id, module_id')
      .in('module_id', modules.map(m => m.id))
      .eq('status', 'published')

    if (courses && courses.length > 0) {
      // Get user's completed lessons with course info in a single query
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          completed_at,
          lessons!inner(
            id,
            course_id,
            title
          )
        `)
        .eq('student_id', user.id)

      if (progressData && !progressError) {
        // Get total lesson counts per course in a single query
        const { data: lessonCounts, error: countError } = await supabase
          .from('lessons')
          .select('course_id')
          .in('course_id', courses.map(c => c.id))

        if (lessonCounts && !countError) {
          // Count lessons per course
          const lessonCountByCourse: Record<string, number> = {}
          lessonCounts.forEach((lesson: Pick<Lesson, 'course_id'>) => {
            if (lesson.course_id) {
              lessonCountByCourse[lesson.course_id] = (lessonCountByCourse[lesson.course_id] || 0) + 1
            }
          })

          // Count completed lessons per course
          const completedByCourse: Record<string, number> = {}
          progressData.forEach((progress: ProgressData) => {
            const courseId = progress.lessons?.course_id
            if (courseId) {
              completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1
            }
          })

          // Calculate progress per module
          for (const moduleItem of modules) {
            const moduleCourses = courses.filter(c => c.module_id === moduleItem.id)
            let totalLessons = 0
            let completedLessons = 0

            for (const course of moduleCourses) {
              totalLessons += lessonCountByCourse[course.id] || 0
              completedLessons += completedByCourse[course.id] || 0
            }

            userProgress[moduleItem.id] = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
          }
        }
      }
    }
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="w-full relative">
        <Image
          src="/header-full-computer-final.jpg"
          alt="Banner"
          width={1920}
          height={354}
          priority
          className="w-full h-auto object-cover max-h-[50vh] sm:max-h-[60vh]"
        />
      </section>

            {/* Modules */}
      <Suspense fallback={
        <section id="modules" className="w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#486681] mx-auto mb-4"></div>
              <p className="text-gray-600">Module werden geladen...</p>
            </div>
          </div>
        </section>
      }>
        <LiveModulesSection
          initialModules={modulesWithCourses}
          userProgress={userProgress}
          isLoggedIn={!!user}
        />
      </Suspense>

      <PartnerSection />

      {/* Floating "Neu hier?" Button */}

    </>
  )
}
