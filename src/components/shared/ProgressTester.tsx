'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Lesson {
  id: string
  title: string
  course_id: string
}

interface Course {
  id: string
  title: string
}

export default function ProgressTester() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch lessons
      const lessonsResponse = await fetch('/api/student/lessons')
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json()
        setLessons(lessonsData.lessons || [])
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/student/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData.courses || [])
      }

      // Fetch progress
      const progressResponse = await fetch('/api/student/progress')
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        const completed = new Set(progressData.progress?.map((p: any) => p.lesson_id) || [])
        setCompletedLessons(completed)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId }),
      })

      if (response.ok) {
        setCompletedLessons(prev => new Set([...prev, lessonId]))
        // Refresh the page to see updated progress
        window.location.reload()
      } else {
        console.error('Failed to mark lesson complete')
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    } finally {
      setLoading(false)
    }
  }

  const markRandomLessonsComplete = async () => {
    if (lessons.length === 0) return

    setLoading(true)
    try {
      // Mark first 3 lessons as complete for testing
      const lessonsToComplete = lessons.slice(0, 3)

      for (const lesson of lessonsToComplete) {
        await fetch('/api/student/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lesson.id }),
        })
      }

      // Refresh to see updated progress
      window.location.reload()
    } catch (error) {
      console.error('Error creating sample progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCourseTitle = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.title || 'Unknown Course'
  }

  if (!user) {
    return null
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🧪 Progress Tester (Development Only)</CardTitle>
        <p className="text-sm text-gray-600">
          Click buttons below to mark lessons as complete and test progress tracking
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Test Button */}
          <div className="border-b pb-4 mb-4">
            <Button
              onClick={markRandomLessonsComplete}
              disabled={loading || lessons.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              🚀 Quick Test: Mark First 3 Lessons Complete
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              This will mark the first 3 lessons as complete to test progress bars
            </p>
          </div>

          {/* Individual Lessons */}
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">{lesson.title}</div>
                <div className="text-sm text-gray-500">{getCourseTitle(lesson.course_id)}</div>
              </div>
              <div className="flex items-center gap-2">
                {completedLessons.has(lesson.id) ? (
                  <span className="text-green-600 font-medium">✅ Complete</span>
                ) : (
                  <Button
                    onClick={() => markLessonComplete(lesson.id)}
                    disabled={loading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {lessons.length === 0 && (
          <p className="text-gray-500 text-center py-8">No lessons found</p>
        )}
      </CardContent>
    </Card>
  )
}