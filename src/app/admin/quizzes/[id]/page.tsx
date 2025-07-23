'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Course {
  id: string
  title: string
}

interface Lesson {
  id: string
  title: string
  course: Course
}

interface Quiz {
  id: string
  title: string
  description: string | null
  scope: 'course' | 'lesson'
  course_id: string | null
  lesson_id: string | null
  pass_percent: number
  max_points: number
  feedback_mode: string
  sort_order: number
  settings: any
  created_at: string
  updated_at: string
  course?: Course
  lesson?: Lesson
  legacy_id?: string
}

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuiz = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.quiz) {
        setQuiz(data.quiz)
      } else {
        throw new Error(data.error || 'Failed to fetch quiz')
      }
    } catch (err) {
      console.error('Error fetching quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (quizId) {
      void fetchQuiz()
    }
  }, [quizId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading quiz...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load quiz</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <div className="flex gap-2">
              <Button
                onClick={() => void fetchQuiz()}
                variant="outline"
                className="mr-2"
              >
                Retry
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/quizzes">
                  Back to Quizzes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href="/admin/quizzes" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Quizzes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-600 mt-2">Quiz Details and Configuration</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/quizzes/${quiz.id}/questions`}>
              View Questions
            </Link>
          </Button>
          <Button asChild className="bg-[#486681] hover:bg-[#3e5570] text-white">
            <Link href={`/admin/quizzes/${quiz.id}/edit`}>
              Edit Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Quiz Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <p className="text-gray-900">{quiz.title}</p>
            </div>
            {quiz.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{quiz.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Scope</label>
              <div className="flex items-center gap-2">
                <Badge variant={quiz.scope === 'course' ? 'default' : 'secondary'}>
                  {quiz.scope === 'course' ? '📚 Course' : '📖 Lesson'}
                </Badge>
              </div>
            </div>
            {quiz.legacy_id && (
              <div>
                <label className="text-sm font-medium text-gray-700">Legacy ID</label>
                <p className="text-gray-900 font-mono text-sm">{quiz.legacy_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.scope === 'lesson' && quiz.lesson ? (
              <div>
                <label className="text-sm font-medium text-gray-700">Lesson</label>
                <p className="text-gray-900">{quiz.lesson.title}</p>
                {quiz.lesson.course && (
                  <p className="text-sm text-gray-500">Course: {quiz.lesson.course.title}</p>
                )}
              </div>
            ) : quiz.scope === 'course' && quiz.course ? (
              <div>
                <label className="text-sm font-medium text-gray-700">Course</label>
                <p className="text-gray-900">{quiz.course.title}</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700">Assignment</label>
                <p className="text-gray-500">Not assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pass Percentage</label>
                <p className="text-gray-900">{quiz.pass_percent}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max Points</label>
                <p className="text-gray-900">{quiz.max_points}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Feedback Mode</label>
              <p className="text-gray-900 capitalize">{quiz.feedback_mode.replace('_', ' ')}</p>
            </div>
            {quiz.sort_order && (
              <div>
                <label className="text-sm font-medium text-gray-700">Sort Order</label>
                <p className="text-gray-900">{quiz.sort_order}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-gray-900">
                {formatDistanceToNow(new Date(quiz.updated_at), { addSuffix: true })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quiz ID</label>
              <p className="text-gray-900 font-mono text-sm">{quiz.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings JSON (if available) */}
      {quiz.settings && Object.keys(quiz.settings).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(quiz.settings, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}