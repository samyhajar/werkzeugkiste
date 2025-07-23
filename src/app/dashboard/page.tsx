'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Play, FileText, HelpCircle } from 'lucide-react'

import { useTableSubscription } from '@/contexts/RealtimeContext'

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
  course_id: string
  order: number
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
  courses: Course[]
}

export default function DashboardPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [userProgress, setUserProgress] = useState<Record<string, number>>({})
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  const fetchStudentData = useCallback(async () => {
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
      setLoading(true)

      // Fetch modules with their courses
      const response = await fetch('/api/modules')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setModules(data.modules || [])
        }
      }

      // Fetch user progress
      const progressResponse = await fetch('/api/student/progress')
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        if (progressData.success) {
          setUserProgress(progressData.progress || {})
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
      fetchInProgress.current = false
    }
  }, [])

  useEffect(() => {
    void fetchStudentData()
  }, [fetchStudentData])

  // Use centralized subscription management with debouncing
  useTableSubscription('modules', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchStudentData()
    }
  })
  useTableSubscription('courses', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchStudentData()
    }
  })
  useTableSubscription('lessons', '*', undefined, () => {
    if (!fetchInProgress.current) {
      void fetchStudentData()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <Badge variant="secondary">
                      {module.courses.length} Kurse
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Fortschritt</span>
                        <span>{getModuleProgress(module)}%</span>
                      </div>
                      <Progress value={getModuleProgress(module)} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      {module.courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{course.title}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {course.lessons.length} Lektionen
                            </span>
                            {course.quizzes.length > 0 && (
                              <HelpCircle className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                      {module.courses.length > 3 && (
                        <div className="text-center">
                          <span className="text-sm text-gray-500">
                            +{module.courses.length - 3} weitere Kurse
                          </span>
                        </div>
                      )}
                    </div>

                    <Link href={`/modules/${module.id}`}>
                      <Button className="w-full" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Weiter lernen
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}