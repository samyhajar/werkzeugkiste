'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [_editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const [newQuestion, setNewQuestion] = useState({
    type: 'single' as string,
    question_html: '',
    points: 10,
    sort_order: 1,
    category: '',
    explanation_html: ''
  })

  const [newAnswers, setNewAnswers] = useState([
    { answer_html: '', is_correct: false, sort_order: 1 },
    { answer_html: '', is_correct: false, sort_order: 2 }
  ])

  useEffect(() => {
    fetchQuizData()
    fetchCourses()
    fetchLessons()
  }, [quizId])

  const fetchQuizData = async () => {
    try {
      setLoading(true)

      // Fetch quiz details
      const quizResponse = await fetch(`/api/admin/quizzes/${quizId}`)
      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quiz')
      }
      const quizData = await quizResponse.json()
      setQuiz(quizData.quiz)

      // Fetch questions and answers
      const questionsResponse = await fetch(`/api/admin/quizzes/${quizId}/questions`)
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        setQuestions(questionsData.questions || [])
        setAnswers(questionsData.answers || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz data')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/admin/lessons')
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  const saveQuiz = async () => {
    if (!quiz) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      })

      if (response.ok) {
        router.push(`/admin/quizzes/${quizId}`)
      } else {
        throw new Error('Failed to save quiz')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

    const addQuestion = async () => {
    console.log('Adding question:', newQuestion)
    try {
      setSaving(true)

      // Add question
      const questionResponse = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          answers: newAnswers
        })
      })

      if (questionResponse.ok) {
        console.log('Question added successfully')
        setIsAddQuestionDialogOpen(false)
        setNewQuestion({
          type: 'single',
          question_html: '',
          points: 10,
          sort_order: 1,
          category: '',
          explanation_html: ''
        })
        setNewAnswers([
          { answer_html: '', is_correct: false, sort_order: 1 },
          { answer_html: '', is_correct: false, sort_order: 2 }
        ])
        fetchQuizData() // Refresh data
      } else {
        const errorData = await questionResponse.json()
        throw new Error(errorData.error || 'Failed to add question')
      }
    } catch (err) {
      console.error('Error adding question:', err)
      setError(err instanceof Error ? err.message : 'Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    console.log('Deleting question:', questionId)
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('Question deleted successfully')
        fetchQuizData() // Refresh data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete question')
      }
    } catch (err) {
      console.error('Error deleting question:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    } finally {
      setSaving(false)
    }
  }

  const addAnswer = () => {
    setNewAnswers(prev => [...prev, {
      answer_html: '',
      is_correct: false,
      sort_order: prev.length + 1
    }])
  }

  const removeAnswer = (index: number) => {
    setNewAnswers(prev => prev.filter((_, i) => i !== index))
  }

  const updateAnswer = (index: number, field: string, value: any) => {
    setNewAnswers(prev => prev.map((answer, i) =>
      i === index ? { ...answer, [field]: value } : answer
    ))
  }

  const toggleCorrectAnswer = (index: number) => {
    setNewAnswers(prev => prev.map((answer, i) => ({
      ...answer,
      is_correct: i === index
    })))
  }

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
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load quiz</div>
          <div className="text-gray-500 text-sm mb-4">{error}</div>
          <Button asChild variant="outline">
            <Link href="/admin/quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link href={`/admin/quizzes/${quizId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Quiz
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Quiz: {quiz.title}</h1>
          <p className="text-gray-600 mt-2">Modify quiz settings, questions, and answers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddQuestionDialogOpen(true)} variant="outline">
            Add Question
          </Button>
          <Button onClick={saveQuiz} disabled={saving} className="bg-[#486681] hover:bg-[#3e5570] text-white">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Quiz Settings */}
      <Card className="mb-6 bg-white">
        <CardHeader className="bg-gray-50">
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={quiz.title}
                onChange={(e) => setQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="mt-1 bg-white border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quiz.description || ''}
                onChange={(e) => setQuiz(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="mt-1 bg-white border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={quiz.scope}
                onValueChange={(value: 'course' | 'lesson') => setQuiz(prev => prev ? { ...prev, scope: value } : null)}
              >
                <SelectTrigger className="mt-1 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="course">Course Quiz</SelectItem>
                  <SelectItem value="lesson">Lesson Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pass_percent">Pass Percentage</Label>
              <Input
                id="pass_percent"
                type="number"
                value={quiz.pass_percent}
                onChange={(e) => setQuiz(prev => prev ? { ...prev, pass_percent: parseInt(e.target.value) } : null)}
                min="0"
                max="100"
                className="mt-1 bg-white border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="max_points">Max Points</Label>
              <Input
                id="max_points"
                type="number"
                value={quiz.max_points}
                onChange={(e) => setQuiz(prev => prev ? { ...prev, max_points: parseInt(e.target.value) } : null)}
                min="1"
                className="mt-1 bg-white border-gray-300"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignment">
              {quiz.scope === 'course' ? 'Course' : 'Lesson'}
            </Label>
                        <Select
              value={quiz.scope === 'course' ? quiz.course_id || '' : quiz.lesson_id || ''}
              onValueChange={(value) => setQuiz(prev => prev ? {
                ...prev,
                course_id: quiz.scope === 'course' ? value : null,
                lesson_id: quiz.scope === 'lesson' ? value : null
              } : null)}
            >
              <SelectTrigger className="mt-1 bg-white border-gray-300">
                <SelectValue placeholder={`Select ${quiz.scope === 'course' ? 'course' : 'lesson'}`} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {quiz.scope === 'course'
                  ? courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))
                  : lessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title} ({lesson.course?.title})
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="bg-white">
        <CardHeader className="bg-gray-50">
          <CardTitle>Questions ({questions.length})</CardTitle>
          <CardDescription>Manage quiz questions and answers</CardDescription>
        </CardHeader>
        <CardContent className="bg-white">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions yet. Click &quot;Add Question&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => {
                const questionAnswers = answers.filter(a => a.question_id === question.id)
                return (
                  <Card key={question.id} className="border-l-4 border-l-blue-500 bg-white">
                    <CardHeader className="bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <span className="text-sm text-gray-500 capitalize">{question.type}</span>
                          <span className="text-sm text-gray-500">{question.points || 0} pts</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingQuestion(question)}
                            variant="outline"
                            size="sm"
                            className="bg-white border-gray-300 hover:bg-gray-50"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => deleteQuestion(question.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-white border-red-300 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="bg-white">
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
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Add a new question to this quiz with multiple answer options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question Type */}
            <div>
              <Label>Question Type</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="single">Single Choice</SelectItem>
                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="free_text">Free Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Text */}
            <div>
              <Label>Question Text</Label>
              <Textarea
                value={newQuestion.question_html}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question_html: e.target.value }))}
                placeholder="Enter your question here..."
                className="mt-1 bg-white border-gray-300"
                rows={3}
              />
            </div>

            {/* Points */}
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={newQuestion.points}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                min="1"
                className="mt-1 bg-white border-gray-300"
              />
            </div>

            {/* Answer Options */}
            {newQuestion.type !== 'free_text' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Answer Options</Label>
                  <Button onClick={addAnswer} variant="outline" size="sm">
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {newAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={answer.answer_html}
                        onChange={(e) => updateAnswer(index, 'answer_html', e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 bg-white border-gray-300"
                      />
                      <Button
                        onClick={() => toggleCorrectAnswer(index)}
                        variant={answer.is_correct ? "default" : "outline"}
                        size="sm"
                      >
                        {answer.is_correct ? "✓ Correct" : "Mark Correct"}
                      </Button>
                      {newAnswers.length > 2 && (
                        <Button
                          onClick={() => removeAnswer(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={newQuestion.explanation_html || ''}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation_html: e.target.value }))}
                placeholder="Explain the correct answer..."
                className="mt-1 bg-white border-gray-300"
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsAddQuestionDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={addQuestion}
              disabled={saving || !newQuestion.question_html.trim() ||
                (newQuestion.type !== 'free_text' && !newAnswers.some(a => a.is_correct))}
              className="bg-[#486681] hover:bg-[#3e5570] text-white"
            >
              {saving ? 'Adding...' : 'Add Question'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}