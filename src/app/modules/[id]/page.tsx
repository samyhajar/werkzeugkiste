'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, User, BarChart3 } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string | null
  module_id: string
  order: number
  lessons: Lesson[]
  quizzes: Quiz[]
}

interface Lesson {
  id: string
  title: string
  content: string | null
  duration_minutes: number | null
  order: number
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

interface Module {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  hero_image: string | null
  created_at: string
  updated_at: string
  courses: Course[]
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lastRefetchTime, setLastRefetchTime] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  const fetchModule = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchInProgress.current) {
      return
    }

    // Debounce requests
    const now = Date.now()
    if (now - lastFetchTime.current < 2000) {
      return
    }

    fetchInProgress.current = true
    lastFetchTime.current = now

    try {
      const response = await fetch(`/api/modules/${moduleId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setModule(data.module)
        }
      }
    } catch (err) {
      console.error('Error fetching module:', err)
    } finally {
      fetchInProgress.current = false
    }
  }, [moduleId])

  // Debounced refetch function to prevent too many API calls
  const _debouncedRefetch = useCallback(() => {
    const now = Date.now()
    if (now - lastRefetchTime > 1000 && !fetchInProgress.current) { // Only refetch if more than 1 second has passed
      setLastRefetchTime(now)
      void fetchModule()
    }
  }, [lastRefetchTime, fetchModule])

  useEffect(() => {
    if (moduleId) {
      void fetchModule()
      void fetchUserAndProgress()
    }
  }, [moduleId, fetchModule])

  // Fetch user and progress data
  const fetchUserAndProgress = useCallback(async () => {
    try {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user && moduleId) {
        // Fetch completed lessons for this module
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed_at')
          .eq('student_id', user.id)

        if (progressData) {
          const completedIds = new Set(progressData.map(p => p.lesson_id))
          setCompletedLessons(completedIds)
        }
      }
    } catch (error) {
      console.error('Error fetching user and progress:', error)
    }
  }, [moduleId])

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!module) return 0
    const totalLessons = module.courses.reduce((total, course) => total + course.lessons.length, 0)
    if (totalLessons === 0) return 0
    return Math.round((completedLessons.size / totalLessons) * 100)
  }

  useEffect(() => {
    if (moduleId) {
      void fetchModule()
      void fetchUserAndProgress()
    }
  }, [moduleId, fetchModule, fetchUserAndProgress])

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        // If clicking on an already expanded course, close it
        newSet.delete(courseId)
      } else {
        // If clicking on a collapsed course, close all others and open this one
        newSet.clear()
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const selectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    // Find the course using the lesson's course_id
    const course = module?.courses.find(c => c.id === lesson.course_id)
    setSelectedCourse(course || null)
  }

  const getTotalLessons = () => {
    if (!module) return 0
    return module.courses.reduce((total, course) => total + course.lessons.length, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Modul wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Fehler</div>
          <p className="text-gray-600 mb-4">{error || 'Modul nicht gefunden'}</p>
          <Button onClick={() => router.push('/')}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Continuous Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-6">
        {/* Right: Progress Bar and User Info */}
        <div className="flex items-center gap-6 ml-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#486681]" />
            </div>
            <div className="w-32">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#486681] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedLessons.size} von {module ? module.courses.reduce((total, course) => total + course.lessons.length, 0) : 0} Lektionen
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#486681] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <div className="text-gray-500 text-xs">Student</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Modules Link - Above Sidebar */}
      <div className="fixed top-16 left-0 w-96 bg-white border-b border-gray-200 z-40">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#486681] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Zurück zu Modulen
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm sticky top-0 mt-28">

        {/* Module Name */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h1 className="font-bold text-xl text-gray-800">{module.title}</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-600 text-sm">{getTotalLessons()} Lektionen</span>
          </div>
        </div>

        {/* Course List Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {module.courses.map((course, index) => (
              <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Course Header */}
                <button
                  onClick={() => toggleCourseExpansion(course.id)}
                  className="w-full px-4 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#de0449] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                        {course.title}
                      </h3>
                    </div>
                  </div>
                  {expandedCourses.has(course.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Course Content */}
                {expandedCourses.has(course.id) && (
                  <div className="bg-white">
                    <div className="px-4 py-2 space-y-1">
                      {/* Lessons */}
                      {course.lessons
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((lesson, _lessonIndex) => (
                          <div key={lesson.id}>
                            <button
                              onClick={() => selectLesson(lesson)}
                              className={`flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded transition-colors group w-full text-left ${
                                selectedLesson?.id === lesson.id ? 'bg-blue-50 text-blue-700' : ''
                              }`}
                            >
                              <FileText className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                              <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                                {lesson.title}
                              </span>
                            </button>

                            {/* Quizzes for this lesson */}
                            {course.quizzes
                              .filter(quiz => quiz.lesson_id === lesson.id)
                              .map((quiz) => (
                                <Link
                                  key={quiz.id}
                                  href={`/quizzes/${quiz.id}`}
                                  className="flex items-center gap-3 py-2 px-2 ml-4 hover:bg-gray-50 rounded transition-colors group"
                                >
                                  <HelpCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                                  <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                                    {quiz.title}
                                  </span>
                                </Link>
                              ))}
                          </div>
                        ))}

                      {/* Course-level quizzes */}
                      {course.quizzes
                        .filter(quiz => !quiz.lesson_id)
                        .map((quiz) => (
                          <Link
                            key={quiz.id}
                            href={`/quizzes/${quiz.id}`}
                            className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded transition-colors group"
                          >
                            <HelpCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                            <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                              {quiz.title}
                            </span>
                          </Link>
                        ))}

                      {/* Empty state for courses with no content */}
                      {course.lessons.length === 0 && course.quizzes.length === 0 && (
                        <div className="px-2 py-4 text-center text-gray-500 text-sm">
                          Noch keine Inhalte verfügbar
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}


          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden mt-32">
        {selectedLesson ? (
          <div className="flex-1 overflow-y-auto">
            {/* Enhanced Lesson Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
              {/* Centered Breadcrumb */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <Link
                  href="/"
                  className="hover:text-[#486681] transition-colors font-medium hover:underline"
                >
                  {module.title}
                </Link>
                <span className="text-gray-400">›</span>
                <span className="text-gray-600 font-medium">
                  {selectedCourse?.title || 'Kurs'}
                </span>
                <span className="text-gray-400">›</span>
                <span className="text-gray-800 font-semibold">
                  {selectedLesson.title}
                </span>
              </div>

              {/* Centered Lesson Title */}
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {selectedLesson.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#486681] rounded-full"></span>
                    Lektion {selectedLesson.order}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#486681] rounded-full"></span>
                    {selectedLesson.duration_minutes || 0} Min
                  </span>
                </div>
              </div>


            </div>

            {/* Enhanced Lesson Content */}
            <div className="px-8 py-8 overflow-y-auto bg-gray-50">
              {selectedLesson.content ? (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8 prose prose-lg max-w-none">
                      <div
                        className="text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">Kein Inhalt verfügbar</h2>
                    <p className="text-gray-500">Diese Lektion hat noch keinen Inhalt.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Wähle eine Lektion aus</h2>
              <p className="text-gray-500">Klicke auf eine Lektion in der Seitenleiste, um den Inhalt anzuzeigen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}