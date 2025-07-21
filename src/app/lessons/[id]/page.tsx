'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, BookOpen, HelpCircle, CheckCircle } from 'lucide-react'
// import { Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProgressTracking } from '@/hooks/useProgressTracking'

interface Lesson {
  id: string
  title: string
  content: string | null
  duration_minutes: number | null
  sort_order: number
  course_id: string
  created_at: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  lesson_id: string | null
  course_id: string
  created_at: string
}

interface Course {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  admin_id: string | null
  created_at: string
  updated_at: string
  lessons: Lesson[]
  quizzes: Quiz[]
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { markLessonComplete } = useProgressTracking()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLessonDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get lesson details
      const lessonsResponse = await fetch(`/api/student/lessons`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!lessonsResponse.ok) {
        throw new Error(`API error: ${lessonsResponse.status}`)
      }

      const lessonsData = await lessonsResponse.json()

      if (lessonsData.success) {
        const foundLesson = lessonsData.lessons?.find((l: Lesson) => l.id === lessonId)
        if (!foundLesson) {
          throw new Error('Lesson not found')
        }
        setLesson(foundLesson)

        // Get course details and other lessons
        const coursesResponse = await fetch(`/api/student/courses`, {
          method: 'GET',
          credentials: 'include',
        })

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          if (coursesData.success) {
            const foundCourse = coursesData.courses?.find((c: Course) => c.id === foundLesson.course_id)
            if (foundCourse) {
              // Get all lessons for this course
              const courseLessons = lessonsData.lessons?.filter((l: Lesson) => l.course_id === foundLesson.course_id) || []

              // Get quizzes for this course
              const quizzesResponse = await fetch(`/api/student/quizzes`, {
                method: 'GET',
                credentials: 'include',
              })

              let quizzes: Quiz[] = []
              if (quizzesResponse.ok) {
                const quizzesData = await quizzesResponse.json()
                if (quizzesData.success) {
                  quizzes = quizzesData.quizzes?.filter((q: Quiz) => q.course_id === foundLesson.course_id) || []
                }
              }

              setCourse({
                ...foundCourse,
                lessons: courseLessons.sort((a: any, b: any) => a.sort_order - b.sort_order),
                quizzes
              })
            }
          }
        }
      } else {
        throw new Error(lessonsData.error || 'Failed to fetch lesson')
      }
    } catch (err) {
      console.error('Error fetching lesson details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lessonId) {
      fetchLessonDetails()
    }
  }, [lessonId])

  // Smart navigation that tracks progress
  const handleNavigateToLesson = useCallback(async (targetLessonId: string) => {
    if (user && lessonId && targetLessonId !== lessonId) {
      // Mark current lesson as complete when navigating to next lesson
      console.log(`[LessonNavigation] Marking lesson ${lessonId} as complete before navigating to ${targetLessonId}`)
      await markLessonComplete(lessonId)
    }
    router.push(`/lessons/${targetLessonId}`)
  }, [user, lessonId, markLessonComplete, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600">Lektion wird geladen...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Fehler beim Laden der Lektion</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <Button onClick={() => fetchLessonDetails()}>
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentLessonIndex = course.lessons.findIndex(l => l.id === lessonId)
  const nextLesson = course.lessons[currentLessonIndex + 1]
  const prevLesson = course.lessons[currentLessonIndex - 1]
  const totalLessons = course.lessons.length

  // Create a combined list of lessons and quizzes in order
  const courseContent: any[] = []
  course.lessons.forEach((courseLesson, index) => {
    courseContent.push({
      type: 'lesson',
      data: courseLesson,
      index: index + 1
    })

    // Add quizzes that belong to this lesson
    const lessonQuizzes = course.quizzes.filter(q => q.lesson_id === courseLesson.id)
    lessonQuizzes.forEach(quiz => {
      courseContent.push({
        type: 'quiz',
        data: quiz,
        lessonIndex: index + 1
      })
    })
  })

  // Add course-level quizzes at the end
  const courseLevelQuizzes = course.quizzes.filter(q => !q.lesson_id)
  courseLevelQuizzes.forEach(quiz => {
    courseContent.push({
      type: 'quiz',
      data: quiz
    })
  })

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[#486681] text-white">
          <Link href="/" className="flex items-center gap-2 text-sm text-blue-100 mb-2 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
            Zurück zu Modulen
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold text-lg">{course.title}</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{totalLessons} Lektionen</span>
          </div>
        </div>

        {/* Course Content Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Expandable Course Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h2 className="font-semibold text-gray-800">{course.title}</h2>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
              </div>
              <span className="ml-8 bg-red-500 text-white text-xs px-2 py-1 rounded">
                abgeschlossen
              </span>
            </div>

            {/* Lessons and Quizzes List */}
            <div className="space-y-1 ml-8">
              {courseContent.map((item, _index) => {
                const isActive = item.type === 'lesson' && item.data.id === lessonId
                const isCompleted = true // For now, assume all are completed

                return (
                  <div key={`${item.type}-${item.data.id}`}>
                    {item.type === 'lesson' ? (
                      <button
                        onClick={() => handleNavigateToLesson(item.data.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-red-500" />
                        <span className="flex-1 text-sm font-medium text-red-500 text-left">
                          Lektion {item.index}: {item.data.title}
                        </span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-red-500" />}
                      </button>
                    ) : (
                      <Link
                        href={`/quizzes/${item.data.id}`}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-red-500" />
                        <span className="flex-1 text-sm font-medium text-red-500">
                          Quiz {item.lessonIndex ? `${item.lessonIndex}: ` : ''}{item.data.title}
                        </span>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-red-500" />}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>


          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Breadcrumb Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-600">Modul 1: Einstieg in die digitale Welt</Link>
            <span>›</span>
            <Link href={`/modules/${course.id}`} className="hover:text-blue-600">{course.title}</Link>
            <span>›</span>
            <span className="text-gray-800">Lektion {currentLessonIndex + 1}: {lesson.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded mr-3">
                Complete
              </span>
              <h1 className="text-2xl font-bold text-gray-800 inline">
                Lektion {currentLessonIndex + 1}: {lesson.title}
              </h1>
            </div>
          </div>
        </header>

        {/* Lesson Content - Full Viewport Layout */}
        <div className="flex-1 flex flex-col bg-gray-50 p-8">
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-2xl shadow-lg p-12 flex-1 flex flex-col">
                                {/* Content Area - Takes available space */}
                <div className="flex-1 overflow-y-auto">
                  {/* Lesson content from database */}
                  {lesson.content ? (
                    <div className="prose prose-xl max-w-none text-center">
                      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    </div>
                  ) : (
                    /* Default content with elegant styling */
                    <div className="text-center space-y-8">
                    <div className="mb-10">
                      <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                        Was bedeutet <span className="font-bold text-[#486681]">digital</span> eigentlich? Das lässt sich am besten im Vergleich zum Gegenteil erklären:
                      </p>
                    </div>

                    {/* Digital vs Analog comparison - Enhanced */}
                    <div className="grid md:grid-cols-2 gap-12 my-16 max-w-4xl mx-auto">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300">
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mb-6 flex items-center justify-center shadow-inner">
                          <span className="text-blue-700 font-semibold">Digitale Stoppuhr</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-xl mb-4">Digitale Stoppuhr</h3>
                        <ul className="text-gray-600 space-y-2 text-left">
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#486681] rounded-full mr-3"></span>
                            kann hunderstel Sekunden messen
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#486681] rounded-full mr-3"></span>
                            benötigt Strom (Batterien)
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl shadow-md border border-amber-100 hover:shadow-lg transition-all duration-300">
                        <div className="w-full h-48 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl mb-6 flex items-center justify-center shadow-inner">
                          <span className="text-amber-700 font-semibold">Analoge Stoppuhr</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-xl mb-4">Analoge Stoppuhr</h3>
                        <ul className="text-gray-600 space-y-2 text-left">
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#486681] rounded-full mr-3"></span>
                            zeigt das Ergebnis ungefähr
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-[#486681] rounded-full mr-3"></span>
                            funktioniert ohne Strom
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-8">
                      <p className="text-xl text-gray-700 leading-relaxed">
                        <span className="font-bold text-[#486681]">Digitalisierung</span> bedeutet, dass immer mehr im Internet auf Computern und Smartphones passiert. Ob uns das nun gefällt oder nicht, diese Veränderungen sind schon da. Damit wir analogen Menschen die digitalen Geräte verwenden können brauchen wir
                      </p>

                      <div className="bg-gradient-to-r from-[#486681]/5 to-[#de0449]/5 rounded-2xl p-8">
                        <ul className="space-y-4 text-lg text-gray-700">
                          <li className="flex items-center justify-center">
                            <span className="w-3 h-3 bg-[#de0449] rounded-full mr-4"></span>
                            ein bisschen Wissen,
                          </li>
                          <li className="flex items-center justify-center">
                            <span className="w-3 h-3 bg-[#de0449] rounded-full mr-4"></span>
                            ein bisschen Erfahrung und
                          </li>
                          <li className="flex items-center justify-center">
                            <span className="w-3 h-3 bg-[#de0449] rounded-full mr-4"></span>
                            manchmal gute Nerven.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Instructor Message - Enhanced */}
                    <div className="mt-16 bg-gradient-to-r from-[#486681]/10 to-[#de0449]/10 rounded-2xl p-10 border border-[#486681]/20">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#486681] to-[#de0449] rounded-full mx-auto mb-6 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">T</span>
                        </div>
                        <blockquote className="text-lg italic text-gray-700 leading-relaxed">
                          „Hallo! Ich bin Tonja. Ich werde dich beim Lernen begleiten.<br />
                          Immer wenn du mein Bild siehst kannst du praktische Informationen und Tipps zum Thema nachlesen."
                        </blockquote>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Navigation buttons - Always at bottom */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 bg-white flex-shrink-0">
              {prevLesson ? (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleNavigateToLesson(prevLesson.id)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Vorherige Lektion
                </Button>
              ) : (
                <div></div>
              )}

              {nextLesson ? (
                <Button
                  className="flex items-center gap-2 bg-[#de0449] hover:bg-[#de0449]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => handleNavigateToLesson(nextLesson.id)}
                >
                  Nächste Lektion
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </Button>
              ) : (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    // Mark current lesson as complete when finishing course
                    if (user && lessonId) {
                      await markLessonComplete(lessonId)
                    }
                    router.push(`/modules/${course.id}`)
                  }}
                >
                  Kurs abschließen
                </Button>
              )}
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  )
}