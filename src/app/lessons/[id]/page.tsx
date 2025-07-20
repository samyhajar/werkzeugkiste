'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, BookOpen, HelpCircle, Clock, CheckCircle } from 'lucide-react'

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
                lessons: courseLessons.sort((a, b) => a.sort_order - b.sort_order),
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[#486681] text-white">
          <Link href="/modules" className="flex items-center gap-2 text-sm text-blue-100 mb-2 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
            Modul 1: Einstieg in die digitale Welt
          </Link>
          <h1 className="font-bold text-lg">{course.title}</h1>
          <div className="text-sm text-blue-100 mt-1">
            {course.lessons.length} Lektionen • {course.quizzes.length} Quizzes • 1 Std. 45 Minuten
          </div>
        </div>

        {/* Course Content Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Kurs Inhalte</h2>

            {/* Lessons */}
            <div className="space-y-2">
              {course.lessons.map((courseLesson, index) => {
                const isActive = courseLesson.id === lessonId
                return (
                  <Link
                    key={courseLesson.id}
                    href={`/lessons/${courseLesson.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isActive ? (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        Lektion {index + 1}: {courseLesson.title}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{courseLesson.duration_minutes || 5} Minuten</span>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Quizzes */}
              {course.quizzes.map((quiz, index) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      Quiz {index + 1}: {quiz.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Breadcrumb Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/modules" className="hover:text-blue-600">Modul 1: Einstieg in die digitale Welt</Link>
            <span>›</span>
            <Link href={`/modules/${course.id}`} className="hover:text-blue-600">{course.title}</Link>
            <span>›</span>
            <span className="text-gray-800">Lektion {currentLessonIndex + 1}: {lesson.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Lektion {currentLessonIndex + 1}: {lesson.title}</h1>
        </header>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl">
            {/* Sample lesson content matching the screenshots */}
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Was bedeutet <strong>digital</strong> eigentlich? Das lässt sich am besten im Vergleich zum Gegenteil erklären:
              </p>

              {/* Digital vs Analog comparison */}
              <div className="grid md:grid-cols-2 gap-8 my-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Digitale Stoppuhr</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-center mb-2">Digitale Stoppuhr</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>– kann hunderstel Sekunden messen</li>
                    <li>– benötigt Strom (Batterien)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Analoge Stoppuhr</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-center mb-2">Analoge Stoppuhr</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>– zeigt das Ergebnis ungefähr</li>
                    <li>– funktioniert ohne Strom</li>
                  </ul>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                <strong>Digitalisierung</strong> bedeutet, dass immer mehr im Internet auf Computern und Smartphones passiert. Ob uns das nun gefällt oder nicht, diese Veränderungen sind schon da. Damit wir analoge Menschen die digitalen Geräte verwenden können brauchen wir
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>ein bisschen Wissen,</li>
                <li>ein bisschen Erfahrung und</li>
                <li>ein bisschen Neugier</li>
              </ul>

              <p className="text-gray-700">
                Für die praktischen Teile benötigst du:
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                <li>Smartphone</li>
                <li>Computer</li>
                <li>Internetverbindung und</li>
                <li>ein bisschen Neugier</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            {prevLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/lessons/${prevLesson.id}`}>
                  ← Vorherige Lektion
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/modules/${course.id}`}>
                  ← Zurück zum Kurs
                </Link>
              </Button>
            )}

            <div className="text-sm text-gray-500">
              Lektion {currentLessonIndex + 1} von {course.lessons.length}
            </div>

            {nextLesson ? (
              <Button asChild>
                <Link href={`/lessons/${nextLesson.id}`}>
                  Nächste Lektion →
                </Link>
              </Button>
            ) : course.quizzes.length > 0 ? (
              <Button asChild>
                <Link href={`/quizzes/${course.quizzes[0].id}`}>
                  Zum Quiz →
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/modules/${course.id}`}>
                  Kurs abschließen →
                </Link>
              </Button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft, BookOpen, HelpCircle, Clock, CheckCircle } from 'lucide-react'

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
                lessons: courseLessons.sort((a, b) => a.sort_order - b.sort_order),
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[#486681] text-white">
          <Link href="/modules" className="flex items-center gap-2 text-sm text-blue-100 mb-2 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
            Modul 1: Einstieg in die digitale Welt
          </Link>
          <h1 className="font-bold text-lg">{course.title}</h1>
          <div className="text-sm text-blue-100 mt-1">
            {course.lessons.length} Lektionen • {course.quizzes.length} Quizzes • 1 Std. 45 Minuten
          </div>
        </div>

        {/* Course Content Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Kurs Inhalte</h2>

            {/* Lessons */}
            <div className="space-y-2">
              {course.lessons.map((courseLesson, index) => {
                const isActive = courseLesson.id === lessonId
                return (
                  <Link
                    key={courseLesson.id}
                    href={`/lessons/${courseLesson.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isActive ? (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        Lektion {index + 1}: {courseLesson.title}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{courseLesson.duration_minutes || 5} Minuten</span>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Quizzes */}
              {course.quizzes.map((quiz, index) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      Quiz {index + 1}: {quiz.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Breadcrumb Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/modules" className="hover:text-blue-600">Modul 1: Einstieg in die digitale Welt</Link>
            <span>›</span>
            <Link href={`/modules/${course.id}`} className="hover:text-blue-600">{course.title}</Link>
            <span>›</span>
            <span className="text-gray-800">Lektion {currentLessonIndex + 1}: {lesson.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Lektion {currentLessonIndex + 1}: {lesson.title}</h1>
        </header>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl">
            {/* Sample lesson content matching the screenshots */}
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Was bedeutet <strong>digital</strong> eigentlich? Das lässt sich am besten im Vergleich zum Gegenteil erklären:
              </p>

              {/* Digital vs Analog comparison */}
              <div className="grid md:grid-cols-2 gap-8 my-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Digitale Stoppuhr</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-center mb-2">Digitale Stoppuhr</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>– kann hunderstel Sekunden messen</li>
                    <li>– benötigt Strom (Batterien)</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Analoge Stoppuhr</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-center mb-2">Analoge Stoppuhr</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>– zeigt das Ergebnis ungefähr</li>
                    <li>– funktioniert ohne Strom</li>
                  </ul>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                <strong>Digitalisierung</strong> bedeutet, dass immer mehr im Internet auf Computern und Smartphones passiert. Ob uns das nun gefällt oder nicht, diese Veränderungen sind schon da. Damit wir analoge Menschen die digitalen Geräte verwenden können brauchen wir
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>ein bisschen Wissen,</li>
                <li>ein bisschen Erfahrung und</li>
                <li>ein bisschen Neugier</li>
              </ul>

              <p className="text-gray-700">
                Für die praktischen Teile benötigst du:
              </p>

              <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                <li>Smartphone</li>
                <li>Computer</li>
                <li>Internetverbindung und</li>
                <li>ein bisschen Neugier</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            {prevLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/lessons/${prevLesson.id}`}>
                  ← Vorherige Lektion
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/modules/${course.id}`}>
                  ← Zurück zum Kurs
                </Link>
              </Button>
            )}

            <div className="text-sm text-gray-500">
              Lektion {currentLessonIndex + 1} von {course.lessons.length}
            </div>

            {nextLesson ? (
              <Button asChild>
                <Link href={`/lessons/${nextLesson.id}`}>
                  Nächste Lektion →
                </Link>
              </Button>
            ) : course.quizzes.length > 0 ? (
              <Button asChild>
                <Link href={`/quizzes/${course.quizzes[0].id}`}>
                  Zum Quiz →
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/modules/${course.id}`}>
                  Kurs abschließen →
                </Link>
              </Button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}