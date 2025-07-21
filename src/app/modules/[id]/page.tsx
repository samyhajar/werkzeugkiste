'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
// import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ChevronLeft, FileText, HelpCircle, CheckCircle } from 'lucide-react'

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
  module_id: string
  admin_id: string | null
  created_at: string
  updated_at: string
  lessons: Lesson[]
  quizzes: Quiz[]
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

  useEffect(() => {
    if (moduleId) {
      fetchModule()
    }
  }, [moduleId])

  const fetchModule = async () => {
    try {
      setLoading(true)
      console.log('[ModuleDetail] Fetching module:', moduleId)
      const response = await fetch(`/api/modules/${moduleId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch module')
      }

      const data = await response.json()
      if (data.success) {
        setModule(data.module)
        // Automatically redirect to the first lesson of the first course
        if (data.module.courses && data.module.courses.length > 0) {
          const firstCourse = data.module.courses[0]
          if (firstCourse.lessons && firstCourse.lessons.length > 0) {
            const firstLesson = firstCourse.lessons.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0]
            if (firstLesson) {
              router.push(`/lessons/${firstLesson.id}`)
              return
            }
          }
        }
        // If no lessons found, expand the first course for sidebar display
        if (data.module.courses && data.module.courses.length > 0) {
          setExpandedCourses(new Set([data.module.courses[0].id]))
        }
      } else {
        setError(data.error || 'Failed to load module')
      }
    } catch (err) {
      setError('Failed to load module')
      console.error('Error fetching module:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-[#486681] text-white">
          <Link href="/" className="flex items-center gap-2 text-sm text-blue-100 mb-2 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {module.title}
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold text-xl">{module.title}</h1>
          </div>
        </div>

        {/* Progress Info */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{getTotalLessons()} Lektionen</span>
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-1 bg-[#de0449] text-white text-xs rounded">
                          abgeschlossen
                        </span>
                      </div>
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
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map((lesson, lessonIndex) => (
                          <div key={lesson.id}>
                            <Link
                              href={`/lessons/${lesson.id}`}
                              className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded transition-colors group"
                            >
                              <FileText className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                              <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                                Lektion {lessonIndex + 1}: {lesson.title}
                              </span>
                              <CheckCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                            </Link>

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
                                  <CheckCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
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
                            <CheckCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
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

            {/* Main Content Area - Shows loading state only */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
            <p className="text-gray-600">Weiterleitung zum ersten Lektions...</p>
          </div>
        </div>
      </div>
    </div>
  )
}