import ModuleCard from '@/components/shared/ModuleCard'
import DummyModuleCard from '@/components/shared/DummyModuleCard'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server-client'
import { Tables } from '@/types/supabase'
import { redirect } from 'next/navigation'
import PartnerSection from '@/components/shared/PartnerSection'
import { cookies } from 'next/headers'

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

  // Fetch published courses
  const { data: fetchedCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .limit(4)

  const courses = fetchedCourses ?? []

  // Fetch user progress if logged in
  let userProgress: Record<string, number> = {}
  if (user) {
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select(`
        lesson_id,
        lessons!inner(course_id)
      `)
      .eq('student_id', user.id)

    if (progressData) {
      // Group progress by course_id and calculate completion percentage
      const progressByCourse: Record<string, { completed: number; total: number }> = {}

      // Get total lessons per course
      for (const course of courses) {
        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id)

        progressByCourse[course.id] = {
          completed: 0,
          total: totalLessons || 0
        }
      }

      // Count completed lessons per course
      for (const progress of progressData) {
        const courseId = (progress.lessons as any)?.course_id
        if (courseId && progressByCourse[courseId]) {
          progressByCourse[courseId].completed++
        }
      }

      // Calculate percentages
      for (const [courseId, { completed, total }] of Object.entries(progressByCourse)) {
        userProgress[courseId] = total > 0 ? Math.round((completed / total) * 100) : 0
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
      <section id="modules" className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          Lernmodule
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          {courses.map((course: Course) => (
            <ModuleCard
              key={course.id}
              course={course}
              progress={userProgress[course.id] || 0}
              isLoggedIn={!!user}
            />
          ))}
          {/* Add placeholders to always show 4 cards */}
          {Array.from({ length: Math.max(0, 4 - courses.length) }).map((_, i) => (
            <DummyModuleCard key={`dummy-${i}`} />
          ))}
        </div>
      </section>

      <PartnerSection />
    </>
  )
}
