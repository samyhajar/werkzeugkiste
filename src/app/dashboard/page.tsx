'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, FileText, HelpCircle, CheckCircle, Play } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
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

  const fetchStudentData = useCallback(async () => {
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
    }
  }, [])

  useEffect(() => {
    fetchStudentData()
  }, [fetchStudentData])

  // Use centralized subscription management
  useTableSubscription('modules', '*', undefined, fetchStudentData)
  useTableSubscription('courses', '*', undefined, fetchStudentData)
  useTableSubscription('lessons', '*', undefined, fetchStudentData)

  const getCourseProgress = (course: Course) => {
    const totalLessons = course.lessons.length
    const completedLessons = course.lessons.filter(lesson =>
      userProgress[lesson.id] === 100
    ).length
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const getTotalProgress = () => {
    let totalLessons = 0
    let completedLessons = 0

    modules.forEach(module => {
      module.courses.forEach(course => {
        totalLessons += course.lessons.length
        course.lessons.forEach(lesson => {
          if (userProgress[lesson.id] === 100) {
            completedLessons++
          }
        })
      })
    })

    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Mein Dashboard</h1>
          <p className="text-gray-600 mt-2">Verfolge deinen Fortschritt in allen Kursen</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Gesamtfortschritt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Fortschritt</span>
                  <span className="text-lg font-bold text-green-600">{getTotalProgress()}%</span>
                </div>
                <Progress value={getTotalProgress()} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules and Courses */}
        <div className="space-y-8">
          {modules.map((module) => (
            <div key={module.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#486681]" />
                <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
              </div>

              {module.description && (
                <p className="text-gray-600 max-w-3xl">{module.description}</p>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {module.courses.map((course) => {
                  const courseProgress = getCourseProgress(course)
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {course.lessons.length} Lektionen
                          </Badge>
                        </div>
                        {course.description && (
                          <CardDescription className="line-clamp-2">
                            {course.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fortschritt</span>
                            <span className="font-medium text-green-600">{courseProgress}%</span>
                          </div>
                          <Progress value={courseProgress} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{course.lessons.length} Lektionen</span>
                          </div>
                          {course.quizzes.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <HelpCircle className="w-4 h-4" />
                              <span>{course.quizzes.length} Quizze</span>
                            </div>
                          )}
                        </div>

                        <Link href={`/modules/${module.id}`}>
                          <Button className="w-full" variant="outline">
                            <Play className="w-4 h-4 mr-2" />
                            Kurs starten
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {module.courses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Kurse in diesem Modul verfügbar</p>
                </div>
              )}
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Module verfügbar</h3>
              <p className="text-gray-500">Schauen Sie später wieder vorbei.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}