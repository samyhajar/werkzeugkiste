'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

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
}

interface Question {
  id: string
  quiz_id: string
  type: string
  question_html: string
  points: number | null
  sort_order: number | null
  category: string | null
  explanation_html: string | null
  meta: any
}

interface Answer {
  id: string
  question_id: string
  answer_html: string
  is_correct: boolean | null
  feedback_html: string | null
  sort_order: number | null
  value_numeric: number | null
  value_text: string | null
  meta: any
}

export default function QuizQuestionsPage() {
  const params = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true)
        const quizId = params.id as string

        // Fetch quiz details
        const quizResponse = await fetch(`/api/admin/quizzes/${quizId}`)
        if (!quizResponse.ok) {
          throw new Error('Failed to fetch quiz')
        }
        const quizData = await quizResponse.json()
        setQuiz(quizData.quiz)

        // Fetch questions
        const questionsResponse = await fetch(`/api/admin/quizzes/${quizId}/questions`)
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json()
          setQuestions(questionsData.questions)
          setAnswers(questionsData.answers)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuizData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-yellow-800 font-semibold">Quiz Not Found</h2>
          <p className="text-yellow-600">The requested quiz could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/quizzes" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Quizzes
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant={quiz.scope === 'course' ? 'default' : 'secondary'}>
            {quiz.scope === 'course' ? '📚 Course' : '📖 Lesson'}
          </Badge>
          <span>Pass Rate: {quiz.pass_percent}%</span>
          <span>Max Points: {quiz.max_points}</span>
          <span>{questions.length} Questions</span>
        </div>
      </div>

      <div className="space-y-6">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">No questions found for this quiz.</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, index) => {
            const questionAnswers = answers.filter(a => a.question_id === question.id)
            return (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Q{index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.type} • {question.points || 0} points
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: question.question_html }}
                  />

                  {questionAnswers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Answers:</h4>
                      <div className="space-y-2">
                        {questionAnswers
                          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map((answer, answerIndex) => (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg border ${
                                answer.is_correct
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {String.fromCharCode(65 + answerIndex)}.
                                </span>
                                {answer.is_correct && (
                                  <Badge variant="default" className="text-xs">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: answer.answer_html }}
                              />
                              {answer.feedback_html && (
                                <div className="mt-2 p-2 bg-blue-50 rounded">
                                  <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: answer.feedback_html }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}