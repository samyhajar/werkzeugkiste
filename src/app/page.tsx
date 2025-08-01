import LiveModulesSection from '@/components/shared/LiveModulesSection'
import RegistrationButton from '@/components/shared/RegistrationButton'
import LogoutCleanup from '@/components/shared/LogoutCleanup'
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
  searchParams: Promise<{ code?: string; error?: string; error_description?: string; 'forgot-password'?: string; 'password-reset'?: string; login?: string }>
}) {
  const { code, error, error_description, 'forgot-password': forgotPasswordStatus, 'password-reset': passwordResetStatus, login } = await searchParams
  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = await createClient()

  // Get current user session
  // const cookieStore = await cookies()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all modules with their courses (status column was removed)
  const { data: fetchedModules } = await supabase
    .from('modules')
    .select('*')
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

  // Fetch all quizzes for these courses from enhanced_quizzes table
  const { data: quizzes } = await supabase
    .from('enhanced_quizzes')
    .select('*')
    .in('course_id', courses?.map(c => c.id) || [])
    .eq('scope', 'course')
    .order('sort_order', { ascending: true })

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
      {/* Clean up logout parameter from URL */}
      <LogoutCleanup />

      {/* Hero Banner */}
      <section className="w-full relative">
        <Image
          src="/header-full-computer-final.jpg"
          alt="Banner"
          width={1920}
          height={354}
          priority
          sizes="100vw"
          className="w-full h-auto object-cover max-h-[50vh] sm:max-h-[60vh] -mt-8"
        />
      </section>

      {/* Error Messages */}
      {error && (
        <section className="w-full bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error === 'email_link_expired'
                    ? 'E-Mail-Link abgelaufen'
                    : 'Authentifizierungsfehler'
                  }
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {error === 'email_link_expired'
                      ? 'Der E-Mail-Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an oder melden Sie sich direkt an.'
                      : error_description || 'Es ist ein Fehler bei der Anmeldung aufgetreten. Versuchen Sie es erneut.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Success Messages */}
      {forgotPasswordStatus === 'sent' && (
        <section className="w-full bg-green-50 border-l-4 border-green-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  E-Mail erfolgreich gesendet!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Falls ein Konto mit Ihrer E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet. Bitte überprüfen Sie auch Ihren Spam-Ordner.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Password Reset Success Message */}
      {passwordResetStatus === 'success' && (
        <section className="w-full bg-green-50 border-l-4 border-green-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Passwort erfolgreich zurückgesetzt!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Ihr Passwort wurde erfolgreich aktualisiert. Sie sind jetzt angemeldet und können alle Funktionen nutzen.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <section id="modules" className="w-full pt-16 pb-12">
          <LiveModulesSection
            initialModules={modulesWithCourses}
            userProgress={userProgress}
            isLoggedIn={!!user}
          />
        </section>
      </Suspense>

      <PartnerSection />

      {/* Registration Button with Modal */}
      <RegistrationButton />

    </>
  )
}
