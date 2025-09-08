'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import LoginModal, { LoginModalRef } from '@/components/shared/LoginModal'
import { useRouter } from 'next/navigation'

interface QuizQuestion {
  id: string
  type: string
  question_html: string
  explanation_html: string | null
  points: number
  sort_order: number
  quiz_answers: {
    id: string
    answer_html: string
    is_correct: boolean
    sort_order: number
  }[]
}

interface Quiz {
  id: string
  title: string
  description: string | null
  lesson_id: string | null
  course_id: string
  created_at: string
  questions: QuizQuestion[]
  pass_percent: number
  max_points: number
}

interface Course {
  id: string
  title: string
  description: string | null
  admin_id: string | null
  created_at: string
  updated_at: string
}

export default function QuizDetailPage() {
  const params = useParams()
  const quizId = params.id as string
  const router = useRouter()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const loginModalRef = useRef<LoginModalRef>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Check authentication on component mount (optional for guest access)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user) // Allow both authenticated and guest users
        setAuthChecked(true)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setUser(null) // Set as guest user
        setAuthChecked(true)
      }
    }

    void checkAuth()
  }, [])

  const fetchQuizDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/quizzes/${quizId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.status}`)
      }

      const data = await response.json()
      console.log('Quiz data received:', data)
      setQuiz(data.quiz)
      setCourse(data.course)
    } catch (err) {
      console.error('Error fetching quiz details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answerId: string, isMultiple: boolean) => {
    setSelectedAnswers(prev => {
      const currentAnswers = prev[questionId] || []

      if (isMultiple) {
        // For multiple choice, toggle the answer
        const newAnswers = currentAnswers.includes(answerId)
          ? currentAnswers.filter(id => id !== answerId)
          : [...currentAnswers, answerId]
        return { ...prev, [questionId]: newAnswers }
      } else {
        // For single choice, replace the answer
        return { ...prev, [questionId]: [answerId] }
      }
    })
  }

  const handleSubmit = async () => {
    if (!quiz) return

    try {
      setSubmitting(true)

      // Use different endpoint for guest vs authenticated users
      const endpoint = user
        ? `/api/quizzes/${quizId}/submit`
        : `/api/quizzes/${quizId}/guest-submit`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to submit quiz: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || data)
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (quizId) {
      void fetchQuizDetails()
    }
  }, [quizId])

  useEffect(() => {
    if (quiz) {
      document.title = quiz.title || 'Quiz'
    }
  }, [quiz])

  // Don't render content until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    )
  }

  // No login requirement - allow guest access

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
            <Link href="/">
              <Button>Zurück zur Übersicht</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#486681] text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="text-white hover:text-blue-200">
                ← Zurück zur Übersicht
              </Link>
              {!user && (
                <div className="text-sm bg-blue-600 px-3 py-1 rounded-full">
                  Gast-Modus
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-blue-100">{course.title}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
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
            <CardContent className="space-y-6">
              {!submitted ? (
                <>
                  {/* Quiz Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">Quiz Anweisungen</h3>
                    <p className="text-blue-700 text-sm">
                      Beantworten Sie alle Fragen. Sie können Ihre Antworten ändern, bevor Sie das Quiz einreichen.
                    </p>
                  </div>

                  {/* Questions */}
                  {quiz.questions && quiz.questions.length > 0 ? (
                    <div className="space-y-6">
                      {quiz.questions.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-3">
                            Frage {index + 1}: {question.question_html}
                          </h3>

                          <div className="space-y-2">
                            {question.quiz_answers.map((answer) => (
                              <label
                                key={answer.id}
                                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                                  name={`question-${question.id}`}
                                  value={answer.id}
                                  checked={selectedAnswers[question.id]?.includes(answer.id) || false}
                                  onChange={() => handleAnswerSelect(question.id, answer.id, question.type === 'multiple')}
                                  className="h-4 w-4 text-blue-600"
                                />
                                <span className="flex-1">{answer.answer_html}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Keine Fragen verfügbar.</p>
                    </div>
                  )}

                                    {/* Debug Info */}
                  <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-100 rounded">
                    <p>Debug: {quiz.questions?.length || 0} Fragen geladen</p>
                    <p>Debug: {Object.keys(selectedAnswers).length} Fragen beantwortet</p>
                  </div>
                </>
              ) : (
                /* Results */
                <div className="space-y-6">
                  <div className={`p-6 rounded-lg text-center ${
                    results?.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <h3 className="font-semibold text-xl mb-2">
                      {results?.passed ? '🎉 Bestanden!' : '❌ Nicht bestanden'}
                    </h3>
                    <p className="text-lg">
                      Punktzahl: {results?.score_percentage?.toFixed(1)}% ({results?.earned_points}/{results?.total_points} Punkte)
                    </p>
                    <p className="text-sm mt-2">
                      Bestehensgrenze: {quiz.pass_percent}%
                    </p>

                    {/* Guest mode notice */}
                    {results?.is_guest && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          {results.message || 'Ergebnisse werden nicht gespeichert. Melden Sie sich an, um Ihren Fortschritt zu verfolgen.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Link href="/">
                      <Button variant="outline">
                        Zurück zur Übersicht
                      </Button>
                    </Link>
                    <Link href={quiz.lesson_id ? `/lessons/${quiz.lesson_id}` : '/'}>
                      <Button>
                        Zur Lektion
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Sticky Submit Button */}
        {!submitted && quiz?.questions && quiz.questions.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
            <div className="max-w-4xl mx-auto flex justify-center">
              <Button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(selectedAnswers).length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                size="lg"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✅</span>
                    Antworten überprüfen ({Object.keys(selectedAnswers).length} beantwortet)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <LoginModal ref={loginModalRef} />
    </>
  )
}
