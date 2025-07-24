'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Play, FileText, HelpCircle, ChevronRight, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTableSubscription } from '@/contexts/RealtimeContext'
import StudentSidebar from '@/components/dashboard/StudentSidebar'

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
  markdown: string | null
  order: number
  course_id: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  course_id: string
}

interface Module {
  id: string
  title: string
  description: string | null
  order: number
  courses: Course[]
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [userProgress, setUserProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/modules')
      const data = await response.json() as { success: boolean; modules?: Module[]; error?: string }

      if (data.success && data.modules) {
        setModules(data.modules)
        if (data.modules.length > 0) {
          setSelectedModule(data.modules[0])
        }
      } else {
        console.error('Failed to fetch modules:', data.error)
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserProgress = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/progress')
      const data = await response.json() as { success: boolean; progress?: Record<string, number>; error?: string }

      if (data.success && data.progress) {
        setUserProgress(data.progress)
      } else {
        console.error('Failed to fetch user progress:', data.error)
      }
    } catch (error) {
      console.error('Error fetching user progress:', error)
    }
  }, [user])

  useEffect(() => {
    fetchModules()
    fetchUserProgress()
  }, [fetchModules, fetchUserProgress])

  // Use centralized subscription management with debouncing
  useTableSubscription('modules', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchModules()
    }
  })
  useTableSubscription('courses', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchModules()
    }
  })
  useTableSubscription('lessons', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchModules()
    }
  })

  const getCourseProgress = (course: Course) => {
    const totalLessons = course.lessons.length
    const completedLessons = course.lessons.filter(lesson =>
      userProgress[lesson.id] === 100
    ).length
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const getModuleProgress = (module: Module) => {
    const allCourses = module.courses
    if (allCourses.length === 0) return 0

    const totalProgress = allCourses.reduce((sum, course) => {
      return sum + getCourseProgress(course)
    }, 0)

    return Math.round(totalProgress / allCourses.length)
  }

  const handleLogout = async () => {
    await signOut()
  }

  // Show loading state if user is not available
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Bitte melden Sie sich an.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <StudentSidebar
        profile={{
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          role: 'student',
          email: user.email || null,
          first_name: null,
          created_at: null,
          updated_at: null
        }}
        role="student"
        userEmail={user.email || ''}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mein Dashboard</h1>
            <p className="text-gray-600">Übersicht über Ihre Lernfortschritte</p>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Module verfügbar</h3>
              <p className="text-gray-600 mb-6">Derzeit sind keine Module für Sie verfügbar.</p>
              <Link href="/">
                <Button>Zur Startseite</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar - Module List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Module</CardTitle>
                    <CardDescription>Wählen Sie ein Modul aus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {modules.map((module) => (
                            <div
                                key={module.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setSelectedModule(module)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setSelectedModule(module)
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Select module ${module.title}`}
                              >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                            <Badge variant="secondary">
                              {module.courses.length} Kurse
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {module.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Fortschritt</span>
                              <span>{getModuleProgress(module)}%</span>
                            </div>
                            <Progress value={getModuleProgress(module)} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Courses and Lessons */}
              <div className="lg:col-span-2">
                {selectedModule ? (
                  <div className="space-y-6">
                    {/* Module Header */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl">{selectedModule.title}</CardTitle>
                            <CardDescription className="text-base">
                              {selectedModule.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {getModuleProgress(selectedModule)}% abgeschlossen
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Courses */}
                    <div className="space-y-4">
                      {selectedModule.courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-6 h-6 text-[#486681]" />
                                <div>
                                  <CardTitle className="text-lg">{course.title}</CardTitle>
                                  <CardDescription>
                                    {course.lessons.length} Lektionen
                                    {course.quizzes.length > 0 && ` • ${course.quizzes.length} Quizze`}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  {getCourseProgress(course)}% abgeschlossen
                                </Badge>
                                {course.quizzes.length > 0 && (
                                  <HelpCircle className="w-5 h-5 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Progress Bar */}
                              <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>Fortschritt</span>
                                  <span>{getCourseProgress(course)}%</span>
                                </div>
                                <Progress value={getCourseProgress(course)} className="h-2" />
                              </div>

                              {/* Lessons List */}
                              <div className="space-y-2">
                                {course.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      {userProgress[lesson.id] === 100 ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                      ) : (
                                        <Clock className="w-5 h-5 text-gray-400" />
                                      )}
                                      <span className="text-sm font-medium">{lesson.title}</span>
                                    </div>
                                    <Link href={`/modules/${selectedModule.id}`}>
                                      <Button size="sm" variant="ghost">
                                        <Play className="w-4 h-4 mr-1" />
                                        Starten
                                      </Button>
                                    </Link>
                                  </div>
                                ))}
                              </div>

                              {/* Course Action */}
                              <Link href={`/modules/${selectedModule.id}`}>
                                <Button className="w-full" variant="outline">
                                  <ChevronRight className="w-4 h-4 mr-2" />
                                  Zum Kurs
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Wählen Sie ein Modul aus
                        </h3>
                        <p className="text-gray-600">
                          Klicken Sie auf ein Modul in der Seitenleiste, um die Kurse anzuzeigen.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}