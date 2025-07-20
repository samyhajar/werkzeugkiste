import ModuleCard from '@/components/shared/ModuleCard'
import DummyModuleCard from '@/components/shared/DummyModuleCard'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server-client'
import { Tables } from '@/types/supabase'
import { redirect } from 'next/navigation'
import PartnerSection from '@/components/shared/PartnerSection'
import { cookies } from 'next/headers'


type Module = Tables<'modules'>
type Course = Tables<'courses'>
type LessonProgress = Tables<'lesson_progress'>

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
  const cookieStore = await cookies()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all published modules
  const { data: fetchedModules } = await supabase
    .from('modules')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const modules = fetchedModules ?? []

  // Fetch user progress if logged in
  let userProgress: Record<string, number> = {}
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
          lessonCounts.forEach(lesson => {
            lessonCountByCourse[lesson.course_id] = (lessonCountByCourse[lesson.course_id] || 0) + 1
          })

          // Count completed lessons per course
          const completedByCourse: Record<string, number> = {}
          progressData.forEach(progress => {
            const courseId = (progress.lessons as any)?.course_id
            if (courseId) {
              completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1
            }
          })

          // Calculate progress per module
          for (const module of modules) {
            const moduleCourses = courses.filter(c => c.module_id === module.id)
            let totalLessons = 0
            let completedLessons = 0

            for (const course of moduleCourses) {
              totalLessons += lessonCountByCourse[course.id] || 0
              completedLessons += completedByCourse[course.id] || 0
            }

            userProgress[module.id] = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
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
      <section id="modules" className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center md:text-left text-gray-800">
            Lernmodule
          </h2>
          {modules.length > 0 ? (
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {modules.map((module: Module) => (
                <ModuleCard
                  key={module.id}
                  course={module}
                  progress={userProgress[module.id] || 0}
                  isLoggedIn={!!user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-gray-600 mb-4">Derzeit sind keine Module verfügbar.</p>
              <p className="text-gray-400 text-sm">Schauen Sie später wieder vorbei.</p>
            </div>
          )}
        </div>
      </section>

      <PartnerSection />

      {/* Floating "Neu hier?" Button */}

    </>
  )
}
