'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Quiz = Tables<'quizzes'>
type Question = Tables<'questions'>
type Option = Tables<'options'>
type Lesson = Tables<'lessons'>
type Course = Tables<'courses'>

interface QuestionWithOptions extends Question {
  options: Option[]
}

interface QuizWithDetails extends Quiz {
  questions: QuestionWithOptions[]
  lesson: Lesson & { course: Course }
}

export default function QuizDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const quizId = params.quizId as string

  const [quiz, setQuiz] = useState<QuizWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    pass_pct: 80
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true)

        // Fetch quiz with lesson, course, questions, and options
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            *,
            lesson:lessons(
              *,
              course:courses(*)
            ),
            questions(
              *,
              options(*)
            )
          `)
          .eq('id', quizId)
          .single()

        if (quizError) throw quizError

        const transformedQuiz = {
          ...quizData,
          questions: quizData.questions.map(q => ({
            ...q,
            options: q.options.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        } as QuizWithDetails

        setQuiz(transformedQuiz)
        setFormData({
          title: quizData.title || '',
          pass_pct: quizData.pass_pct || 80
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quiz')
      } finally {
        setLoading(false)
      }
    }

    void fetchQuiz()
  }, [quizId, supabase])

  const handleSave = async () => {
    if (!quiz) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: formData.title,
          pass_pct: formData.pass_pct
        })
        .eq('id', quizId)

      if (error) throw error

      setQuiz({ ...quiz, ...formData })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error

      router.push(`/admin/courses/${courseId}/lessons/${lessonId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      if (quiz) {
        setQuiz({
          ...quiz,
          questions: quiz.questions.filter(q => q.id !== questionId)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive text-lg mb-4">Error loading quiz</p>
            <p className="text-foreground/60">{error}</p>
            <Button asChild className="mt-4">
              <Link href={`/admin/courses/${courseId}/lessons/${lessonId}`}>Back to Lesson</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-4">Quiz not found</p>
            <Button asChild>
              <Link href={`/admin/courses/${courseId}/lessons/${lessonId}`}>Back to Lesson</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href={`/admin/courses/${courseId}/lessons/${lessonId}`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Lesson
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Quiz Details</h2>
              <p className="text-foreground/60">
                {quiz.lesson.course.title} - {quiz.lesson.title}
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Quiz
          </Button>
        </div>

        {/* Quiz Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quiz Information</CardTitle>
                <CardDescription>
                  Quiz settings and configuration
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Quiz title"
                  />
                </div>
                <div>
                  <Label htmlFor="pass_pct">Pass Percentage</Label>
                  <Input
                    id="pass_pct"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.pass_pct}
                    onChange={(e) => setFormData({ ...formData, pass_pct: parseInt(e.target.value) || 80 })}
                    placeholder="80"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Title</Label>
                  <p className="text-foreground">{quiz.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground/60">Pass Percentage</Label>
                    <p className="text-foreground">{quiz.pass_pct}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground/60">Questions</Label>
                    <p className="text-foreground">{quiz.questions.length}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Created</Label>
                  <p className="text-foreground">
                    {quiz.created_at
                      ? formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Manage quiz questions and answers
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}/questions/new`}>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Question
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {quiz.questions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No questions yet</h3>
                <p className="text-foreground/60 mb-4">Add questions to build your quiz</p>
                <Button asChild>
                  <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}/questions/new`}>
                    Add First Question
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-brand-primary">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">{question.question}</CardTitle>
                            <CardDescription>
                              <Badge variant={question.type === 'single' ? 'default' : 'secondary'}>
                                {question.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/${quizId}/questions/${question.id}`}>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border ${
                              option.is_correct
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="flex-1">{option.option_text}</span>
                              {option.is_correct && (
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}