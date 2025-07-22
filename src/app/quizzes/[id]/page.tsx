'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'

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
}

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/quizzes/${quizId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.status}`)
      }

      const data = await response.json()
      setQuiz(data.quiz)
      setCourse(data.course)
    } catch (err) {
      console.error('Error fetching quiz details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (quizId) {
      fetchQuizDetails()
    }
  }, [quizId])

  useEffect(() => {
    if (quiz) {
      document.title = quiz.title || 'Quiz'
    }
  }, [quiz])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Quiz wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <HelpCircle className="h-6 w-6" />
              Quiz nicht gefunden
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error || 'Das angeforderte Quiz konnte nicht geladen werden.'}
            </p>
            <Link href="/dashboard">
              <Button>Zurück zur Übersicht</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#486681] text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="text-white hover:text-blue-200">
              ← Zurück zur Übersicht
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-blue-100">{course.title}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              Quiz: {quiz.title}
            </CardTitle>
            <CardDescription>
              {quiz.description || 'Testen Sie Ihr Wissen mit diesem interaktiven Quiz.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Quiz wird vorbereitet</h3>
              <p className="text-blue-700">
                Dieses Quiz ist derzeit in Entwicklung und wird bald verfügbar sein.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button variant="outline">
                  Zurück zur Übersicht
                </Button>
              </Link>
              <Link href={quiz.lesson_id ? `/lessons/${quiz.lesson_id}` : '/dashboard'}>
                <Button>
                  Zur Lektion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
