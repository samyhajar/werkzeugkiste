import ModuleCard from '@/components/shared/ModuleCard'
import DummyModuleCard from '@/components/shared/DummyModuleCard'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server-client'
import { Tables } from '@/types/supabase'
import { redirect } from 'next/navigation'
import PartnerSection from '@/components/shared/PartnerSection'
import { cookies } from 'next/headers'
import NewHereButton from '@/components/shared/NewHereButton'
import ProgressTester from '@/components/shared/ProgressTester'

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

  // Fetch all published courses
  const { data: fetchedCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const courses = fetchedCourses ?? []

  // Fetch user progress if logged in
  let userProgress: Record<string, number> = {}
  if (user) {
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

        // Calculate percentages
        for (const courseId of courses.map(c => c.id)) {
          const totalLessons = lessonCountByCourse[courseId] || 0
          const completedLessons = completedByCourse[courseId] || 0
          userProgress[courseId] = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        }
      }
    }
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="w-full">
        <Image
          src="/header-full-computer-final.jpg"
          alt="Banner"
          width={1920}
          height={354}
          priority
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Modules */}
      <section id="modules" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center md:text-left text-gray-800">
          Lernmodule
        </h2>
        {courses.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: Course) => (
              <ModuleCard
                key={course.id}
                course={course}
                progress={userProgress[course.id] || 0}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">Derzeit sind keine Module verfügbar.</p>
            <p className="text-gray-400 text-sm">Schauen Sie später wieder vorbei.</p>
          </div>
        )}
      </section>

      {/* Progress Tester for Development */}
      <ProgressTester />

      <PartnerSection />

      {/* Floating "Neu hier?" Button */}
      <NewHereButton />
    </>
  )
}
