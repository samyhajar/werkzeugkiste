'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileText, HelpCircle } from 'lucide-react'

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

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'modul' | 'unterlagen'>('modul')
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

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
        // Transform module structure to match the component's expectations
        const moduleData = data.module
        // Flatten the first course's data to the module level for compatibility
        const firstCourse = moduleData.courses?.[0] || {}
        setModule({
          ...firstCourse,
          ...moduleData,
          // Combine all lessons from all courses
          lessons: moduleData.courses?.flatMap((course: any) => course.lessons || []) || [],
          // Combine all quizzes from all courses
          quizzes: moduleData.courses?.flatMap((course: any) => course.quizzes || []) || []
        })
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

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
      }
      return newSet
    })
  }

  const handleCloseModal = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Modul wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Fehler</div>
          <p className="text-gray-600 mb-4">{error || 'Modul nicht gefunden'}</p>
          <Button onClick={handleCloseModal}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/Modul-1-Digitalisierung-e1655816152674.png')"
        }}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col my-4">
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-12 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <div className="flex items-center justify-between">
              {/* Left side - Module Image */}
              <div className="w-80 h-48 rounded-lg flex items-center justify-center relative">
                <img
                  src="/Modul-1-Digitalisierung-e1655816152674.png"
                  alt="Module Illustration"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              {/* Right side - Module Info and Buttons */}
              <div className="flex-1 ml-16">
                <div className="text-right">
                  <h1 className="text-5xl font-bold mb-6 leading-tight">
                    {module.title}
                  </h1>

                  <div className="flex items-center justify-end gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-lg font-medium">{module.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-sm flex items-center justify-center">
                        <span className="text-black text-sm">📅</span>
                      </div>
                      <span className="text-lg font-medium">
                        Erstellt: {new Date(module.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end">
                    <button
                      onClick={handleCloseModal}
                      className="px-8 py-3 border-2 border-gray-400 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-300 transition-all duration-200 font-medium tracking-wide"
                    >
                      ZURÜCK
                    </button>
                    {/* Dynamic button based on completion status */}
                    {module.lessons.length > 0 ? (
                      <Link
                        href={`/lessons/${module.lessons.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.id}`}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium tracking-wide shadow-lg inline-block text-center"
                      >
                        MODUL STARTEN
                      </Link>
                    ) : (
                      <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium tracking-wide shadow-lg">
                        ZERTIFIKAT HERUNTERLADEN
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent"></div>
        </div>

        {/* Modal Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex px-8">
              <button
                onClick={() => setActiveTab('modul')}
                className={`px-8 py-4 font-medium text-sm tracking-wide border-b-2 ${
                  activeTab === 'modul'
                    ? 'text-gray-800 border-blue-500 bg-blue-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 MODUL
              </button>
              <button
                onClick={() => setActiveTab('unterlagen')}
                className={`px-8 py-4 font-medium text-sm tracking-wide border-b-2 ${
                  activeTab === 'unterlagen'
                    ? 'text-gray-800 border-blue-500 bg-blue-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📄 UNTERLAGEN FÜR VORTRAGENDE
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            {activeTab === 'modul' ? (
              <div className="space-y-8">
                {/* Course Overview */}
                {module.description && (
                  <div>
                    <h1 className="text-3xl font-bold text-[#de0449] mb-6">Worum geht es hier?</h1>
                    <p className="text-gray-700 text-lg leading-relaxed mb-8">{module.description}</p>
                  </div>
                )}

                {/* Module Content */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-700">Modul Content</h2>
                    <button
                      onClick={() => {
                        if (expandedLessons.size > 0) {
                          setExpandedLessons(new Set())
                        } else {
                          setExpandedLessons(new Set([module.id]))
                        }
                      }}
                      className="px-4 py-2 border border-gray-400 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      ALLES AUSKLAPPEN
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Main Course */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleLessonExpansion(module.id)}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-gray-600">1</span>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-800">{module.title}</h3>
                            <span className="inline-block mt-1 px-2 py-1 bg-[#de0449] text-white text-xs rounded">
                              {module.status === 'published' ? 'veröffentlicht' : 'entwurf'}
                            </span>
                          </div>
                        </div>
                        {expandedLessons.has(module.id) ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {expandedLessons.has(module.id) && (
                        <div className="bg-white border-l-4 border-gray-400">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>Kurs Inhalte</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-gray-500">
                                  {module.lessons.length + module.quizzes.filter(q => !q.lesson_id).length} Inhalte
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {/* Lessons */}
                              {module.lessons
                                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                .map((lesson) => (
                                  <div key={lesson.id}>
                                    <Link
                                      href={`/lessons/${lesson.id}`}
                                      className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2 cursor-pointer transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-[#de0449]" />
                                        <span className="text-[#de0449] font-medium hover:text-[#b8043a]">{lesson.title}</span>
                                      </div>
                                    </Link>

                                    {/* Quizzes for this lesson */}
                                    {module.quizzes
                                      .filter(quiz => quiz.lesson_id === lesson.id)
                                      .map((quiz) => (
                                        <Link
                                          key={quiz.id}
                                          href={`/quizzes/${quiz.id}`}
                                          className="flex items-center justify-between py-2 ml-7 hover:bg-gray-50 rounded px-2 -mx-2 cursor-pointer transition-colors"
                                        >
                                          <div className="flex items-center gap-3">
                                            <HelpCircle className="h-4 w-4 text-[#de0449]" />
                                            <span className="text-[#de0449] font-medium hover:text-[#b8043a]">{quiz.title}</span>
                                          </div>
                                        </Link>
                                      ))}
                                  </div>
                                ))}

                              {/* Course-level quizzes */}
                              {module.quizzes
                                .filter(quiz => !quiz.lesson_id)
                                .map((quiz) => (
                                  <Link
                                    key={quiz.id}
                                    href={`/quizzes/${quiz.id}`}
                                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 -mx-2 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <HelpCircle className="h-4 w-4 text-[#de0449]" />
                                      <span className="text-[#de0449] font-medium hover:text-[#b8043a]">{quiz.title}</span>
                                    </div>
                                  </Link>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {module.lessons.length === 0 && module.quizzes.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FileText className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Noch keine Inhalte verfügbar
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Dieses Modul enthält noch keine Lektionen oder Quizzes.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <h2 className="text-2xl font-semibold mb-4">Unterlagen für Vortragende</h2>
                <p>Dieser Bereich ist noch nicht verfügbar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}