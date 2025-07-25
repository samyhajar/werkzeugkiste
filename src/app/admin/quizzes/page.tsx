'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
}

interface Lesson {
  id: string
  title: string
  course: Course
}

interface QuizQuestion {
  id?: number
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  question_text: string
  explanation: string
  sort_order: number
  options: {
    text: string
    is_correct: boolean
  }[]
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

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingQuestions, setEditingQuestions] = useState<QuizQuestion[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    scope: 'course' as 'course' | 'lesson',
    course_id: '',
    lesson_id: '',
    pass_percent: 70,
    max_points: 100,
    feedback_mode: 'at_end',
    questions: [] as QuizQuestion[]
  })

  const router = useRouter()

  useEffect(() => {
    fetchQuizzes()
    fetchCourses()
    fetchLessons()
  }, [])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/quizzes')
      console.log('Fetch quizzes response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Fetch quizzes data:', data)
        setQuizzes(data.quizzes || [])
      } else {
        console.error('Failed to fetch quizzes:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setLoading(false)
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

  const addQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
      type: 'multiple_choice',
      question_text: '',
      explanation: '',
        sort_order: prev.questions.length + 1,
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
      }]
    }))
  }

  const removeQuestion = (index: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const updateQuestionType = (type: 'multiple_choice' | 'true_false' | 'short_answer') => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, _i) => ({
        ...q,
        type,
        options: type === 'multiple_choice' ? [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ] : type === 'true_false' ? [
        { text: 'True', is_correct: false },
        { text: 'False', is_correct: false }
        ] : []
      }))
    }))
  }

  const updateQuestionText = (index: number, text: string) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, question_text: text } : q
      )
    }))
  }

  const updateOption = (index: number, text: string) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, options: q.options.map((opt, j) =>
          j === 0 ? { ...opt, text } : opt
        )} : q
      )
    }))
  }

  const toggleCorrectAnswer = (index: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, options: q.options.map((opt, j) =>
          j === index ? { ...opt, is_correct: !opt.is_correct } : opt
        )} : q
      )
    }))
  }

  const addOption = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === prev.questions.length - 1 ? { ...q, options: [...q.options, { text: '', is_correct: false }] } : q
      )
    }))
  }

  const removeOption = (index: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === prev.questions.length - 1 ? { ...q, options: q.options.filter((_, j) => j !== index) } : q
      )
    }))
  }

  const openEditDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setIsEditDialogOpen(true)
    // Initialize editing questions (you'll need to fetch questions for this quiz)
    setEditingQuestions([])
    void fetchQuizQuestions(quiz.id)
  }

  const fetchQuizQuestions = async (quizId: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions) {
          setEditingQuestions(data.questions)
        }
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error)
    }
  }

  const addEditingQuestion = () => {
    const newQuestion: QuizQuestion = {
      type: 'multiple_choice',
      question_text: '',
      explanation: '',
      sort_order: editingQuestions.length,
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }
    setEditingQuestions([...editingQuestions, newQuestion])
  }

  const removeEditingQuestion = (index: number) => {
    setEditingQuestions(editingQuestions.filter((_, i) => i !== index))
  }

  const updateEditingQuestionType = (index: number, type: 'multiple_choice' | 'true_false' | 'short_answer') => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      type,
      options: type === 'multiple_choice' ? [
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ] : type === 'true_false' ? [
        { text: 'True', is_correct: false },
        { text: 'False', is_correct: false }
      ] : []
    }
    setEditingQuestions(updatedQuestions)
  }

  const updateEditingQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      question_text: text
    }
    setEditingQuestions(updatedQuestions)
  }

  const updateEditingOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[questionIndex].options[optionIndex].text = text
    setEditingQuestions(updatedQuestions)
  }

  const toggleEditingCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...editingQuestions]
    const question = updatedQuestions[questionIndex]

    if (question.type === 'multiple_choice') {
      // For multiple choice, only one option can be correct
      question.options.forEach((option, i) => {
        option.is_correct = i === optionIndex
      })
    } else if (question.type === 'true_false') {
      // For true/false, only one option can be correct
      question.options.forEach((option, i) => {
        option.is_correct = i === optionIndex
      })
    }

    setEditingQuestions(updatedQuestions)
  }

  const addEditingOption = (questionIndex: number) => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[questionIndex].options.push({ text: '', is_correct: false })
    setEditingQuestions(updatedQuestions)
  }

  const removeEditingOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...editingQuestions]
    updatedQuestions[questionIndex].options.splice(optionIndex, 1)
    setEditingQuestions(updatedQuestions)
  }

  const updateQuiz = async () => {
    if (!editingQuiz) return

    setSaving(true)
    try {
      // First update the quiz basic info
      const quizResponse = await fetch(`/api/admin/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editingQuiz.title,
          description: editingQuiz.description,
          scope: editingQuiz.scope,
          course_id: editingQuiz.course_id,
          lesson_id: editingQuiz.lesson_id,
          pass_percent: editingQuiz.pass_percent,
          max_points: editingQuiz.max_points,
          feedback_mode: editingQuiz.feedback_mode
        }),
      })

      if (!quizResponse.ok) {
        throw new Error(`API error: ${quizResponse.status}`)
      }

      const quizData = await quizResponse.json()

      if (quizData.success) {
        // Update questions if there are any
        if (editingQuestions.length > 0) {
          const questionsResponse = await fetch(`/api/admin/quizzes/${editingQuiz.id}/questions`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              questions: editingQuestions
            }),
          })

          if (!questionsResponse.ok) {
            throw new Error(`API error: ${questionsResponse.status}`)
          }

          const questionsData = await questionsResponse.json()
          if (!questionsData.success) {
            throw new Error(questionsData.error || 'Failed to update questions')
          }
        }

        // Refresh the quizzes list
        await fetchQuizzes()
        setIsEditDialogOpen(false)
        setEditingQuiz(null)
        setEditingQuestions([])
      } else {
        throw new Error(quizData.error || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
    } finally {
      setSaving(false)
    }
  }

  const createQuiz = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuiz),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewQuiz({
          title: '',
          description: '',
          scope: 'course',
          course_id: '',
          lesson_id: '',
          pass_percent: 70,
          max_points: 100,
          feedback_mode: 'at_end',
          questions: []
        })
        fetchQuizzes()
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
    } finally {
      setCreating(false)
    }
  }

  const openDeleteDialog = (quiz: Quiz) => {
    setDeletingQuiz(quiz)
    setIsDeleteDialogOpen(true)
  }

  const deleteQuiz = async () => {
    if (!deletingQuiz) return

    try {
      setDeleting(true)
      console.log('Deleting quiz:', deletingQuiz.id)

      const response = await fetch(`/api/admin/quizzes/${deletingQuiz.id}`, {
        method: 'DELETE',
      })

      console.log('Delete response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete response error:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Delete response data:', data)

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete quiz')
      }

      // Close dialog and refresh quizzes list
      setIsDeleteDialogOpen(false)
      setDeletingQuiz(null)
      console.log('Refreshing quizzes list...')
      await fetchQuizzes()
      console.log('Quizzes list refreshed')
    } catch (error) {
      console.error('Error deleting quiz:', error)
      alert('Failed to delete quiz. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesScope = scopeFilter === 'all' || quiz.scope === scopeFilter
    return matchesSearch && matchesScope
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#6e859a] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Quizzes</h1>
          <p className="text-white mt-2">Verwalten Sie Kurs- und Lektions-Quizzes mit erweiterten Funktionen</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#486681] hover:bg-[#3e5570] text-white"
        >
          <span className="mr-2">✨</span>
          Create Enhanced Quiz
            </Button>
              </div>

      {/* Create Quiz Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Enhanced Quiz</DialogTitle>
            <DialogDescription>
              Create a new quiz with advanced features like multiple question types and detailed feedback.
              </DialogDescription>
            </DialogHeader>

          <div className="space-y-6">
            {/* Basic Quiz Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      value={newQuiz.title}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                  className="mt-1"
                    />
                  </div>
              <div>
                <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newQuiz.description}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter quiz description"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scope">Scope</Label>
                <Select
                  value={newQuiz.scope}
                  onValueChange={(value: 'course' | 'lesson') => setNewQuiz(prev => ({ ...prev, scope: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={newQuiz.pass_percent}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, pass_percent: parseInt(e.target.value) }))}
                      min="0"
                      max="100"
                  className="mt-1"
                    />
                  </div>
              <div>
                <Label htmlFor="max_points">Max Points</Label>
                <Input
                  id="max_points"
                  type="number"
                  value={newQuiz.max_points}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, max_points: parseInt(e.target.value) }))}
                  min="1"
                  className="mt-1"
                />
              </div>
                  </div>

            {/* Course/Lesson Selection */}
            <div>
              <Label htmlFor="course_lesson">
                {newQuiz.scope === 'course' ? 'Course' : 'Lesson'}
              </Label>
              <Select
                value={newQuiz.scope === 'course' ? newQuiz.course_id : newQuiz.lesson_id}
                onValueChange={(value) => setNewQuiz(prev => ({
                  ...prev,
                  course_id: newQuiz.scope === 'course' ? value : '',
                  lesson_id: newQuiz.scope === 'lesson' ? value : ''
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Select ${newQuiz.scope === 'course' ? 'course' : 'lesson'}`} />
                </SelectTrigger>
                <SelectContent>
                  {newQuiz.scope === 'course'
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

            {/* Questions Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Questions</Label>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  Add Question
                </Button>
              </div>
              <div className="space-y-4">
                    {newQuiz.questions.map((question, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <Button
                          onClick={() => removeQuestion(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => updateQuestionType(value)}
                        >
                          <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                      <div>
                        <Label>Question Text</Label>
                    <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestionText(index, e.target.value)}
                          placeholder="Enter your question"
                          className="mt-1"
                        />
                      </div>
                      {question.type === 'multiple_choice' && (
                        <div>
                          <Label>Options</Label>
                          <div className="space-y-2 mt-1">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(optionIndex, e.target.value)}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1"
                                />
                          <Button
                                  onClick={() => toggleCorrectAnswer(optionIndex)}
                            variant={option.is_correct ? "default" : "outline"}
                            size="sm"
                          >
                                  {option.is_correct ? "✓ Correct" : "Mark Correct"}
                          </Button>
                                {question.options.length > 2 && (
                            <Button
                                    onClick={() => removeOption(optionIndex)}
                              variant="outline"
                              size="sm"
                                    className="text-red-600"
                            >
                                    Remove
                            </Button>
                          )}
                        </div>
                      ))}
                            <Button onClick={addOption} variant="outline" size="sm">
                              Add Option
                  </Button>
                </div>
              </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            </div>

            {/* Action Buttons - Fixed Footer */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 flex-shrink-0 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={creating}
                className="sm:w-auto w-full h-9 text-sm"
              >
                <span className="mr-2">❌</span>
                Cancel
              </Button>
              <Button
                onClick={() => void createQuiz()}
              disabled={creating || !newQuiz.title.trim() ||
                (newQuiz.scope === 'lesson' && !newQuiz.lesson_id) ||
                (newQuiz.scope === 'course' && !newQuiz.course_id) ||
                newQuiz.questions.length === 0}
                className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
              >
                {creating ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                  Create Enhanced Quiz
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Update quiz settings and assignments.
            </DialogDescription>
          </DialogHeader>

          {editingQuiz && (
            <div className="space-y-6">
              {/* Basic Quiz Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Quiz Title</Label>
                  <Input
                    id="edit-title"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Enter quiz title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingQuiz.description || ''}
                    onChange={(e) => setEditingQuiz(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter quiz description"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Quiz Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-scope">Scope</Label>
                  <Select
                    value={editingQuiz.scope}
                    onValueChange={(value: 'course' | 'lesson') => setEditingQuiz(prev => prev ? { ...prev, scope: value, course_id: value === 'course' ? prev.course_id : '', lesson_id: value === 'lesson' ? prev.lesson_id : '' } : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course Quiz</SelectItem>
                      <SelectItem value="lesson">Lesson Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-pass-percent">Pass Percentage</Label>
                  <Input
                    id="edit-pass-percent"
                    type="number"
                    value={editingQuiz.pass_percent}
                    onChange={(e) => setEditingQuiz(prev => prev ? { ...prev, pass_percent: parseInt(e.target.value) } : null)}
                    min="0"
                    max="100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max-points">Max Points</Label>
                  <Input
                    id="edit-max-points"
                    type="number"
                    value={editingQuiz.max_points}
                    onChange={(e) => setEditingQuiz(prev => prev ? { ...prev, max_points: parseInt(e.target.value) } : null)}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Course/Lesson Selection */}
              <div>
                <Label htmlFor="edit-assignment">
                  {editingQuiz.scope === 'course' ? 'Course Assignment' : 'Lesson Assignment'}
                </Label>
                <Select
                  value={editingQuiz.scope === 'course' ? editingQuiz.course_id || '' : editingQuiz.lesson_id || ''}
                  onValueChange={(value) => setEditingQuiz(prev => prev ? {
                    ...prev,
                    course_id: editingQuiz.scope === 'course' ? value : '',
                    lesson_id: editingQuiz.scope === 'lesson' ? value : ''
                  } : null)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Select ${editingQuiz.scope === 'course' ? 'course' : 'lesson'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {editingQuiz.scope === 'course'
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
                <p className="text-xs text-gray-500 mt-1">
                  {editingQuiz.scope === 'course'
                    ? 'Course quizzes appear at the end of the course'
                    : 'Lesson quizzes appear at the end of the specific lesson'
                  }
                </p>
              </div>

              {/* Current Assignment Info */}
              {(editingQuiz.course_id || editingQuiz.lesson_id) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Current Assignment:</strong>
                    <div className="mt-1">
                      {editingQuiz.scope === 'lesson' && editingQuiz.lesson?.title
                        ? `${editingQuiz.lesson.title} (Course: ${editingQuiz.lesson.course?.title})`
                        : editingQuiz.scope === 'course' && editingQuiz.course?.title
                        ? editingQuiz.course.title
                        : 'Unassigned'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Questions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Questions</Label>
                  <Button onClick={addEditingQuestion} variant="outline" size="sm">
                    Add Question
                  </Button>
                </div>
                <div className="space-y-4">
                  {editingQuestions.map((question, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                          <Button
                            onClick={() => removeEditingQuestion(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Question Type</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => updateEditingQuestionType(index, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => updateEditingQuestionText(index, e.target.value)}
                            placeholder="Enter your question"
                            className="mt-1"
                          />
                        </div>
                        {(question.type === 'multiple_choice' || question.type === 'true_false') && (
                          <div>
                            <Label>Options</Label>
                            <div className="space-y-2 mt-1">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option.text}
                                    onChange={(e) => updateEditingOption(index, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={() => toggleEditingCorrectAnswer(index, optionIndex)}
                                    variant={option.is_correct ? "default" : "outline"}
                                    size="sm"
                                  >
                                    {option.is_correct ? "✓ Correct" : "Mark Correct"}
                                  </Button>
                                  {question.options.length > 2 && (
                                    <Button
                                      onClick={() => removeEditingOption(index, optionIndex)}
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button onClick={() => addEditingOption(index)} variant="outline" size="sm">
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={saving}
                  className="sm:w-auto w-full h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void updateQuiz()}
                  disabled={saving || !editingQuiz.title.trim() ||
                    (editingQuiz.scope === 'lesson' && !editingQuiz.lesson_id) ||
                    (editingQuiz.scope === 'course' && !editingQuiz.course_id) ||
                    editingQuestions.length === 0}
                  className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
                >
                  {saving ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingQuiz?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
              className="sm:w-auto w-full h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void deleteQuiz()}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white sm:w-auto w-full h-9 text-sm"
            >
              {deleting ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <span className="mr-2">🗑️</span>
                  Delete Quiz
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-gray-300"
          />
        </div>
        <Select
          value={scopeFilter}
          onValueChange={(value: string) => setScopeFilter(value)}
        >
          <SelectTrigger className="w-[200px] bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="course">Course Quizzes</SelectItem>
            <SelectItem value="lesson">Lesson Quizzes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quizzes Table */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {quizzes.length === 0 ? 'No enhanced quizzes created yet' : 'No quizzes match your search'}
          </div>
          {quizzes.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486681] hover:bg-[#3e5570] text-white">
              Create Your First Enhanced Quiz
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Settings
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
          {filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                        {quiz.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {quiz.description}
                          </div>
                        )}
                        {quiz.legacy_id && (
                          <div className="text-xs text-gray-400 mt-1">
                            Legacy ID: {quiz.legacy_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={quiz.scope === 'course' ? 'default' : 'secondary'}>
                        {quiz.scope === 'course' ? '📚 Course' : '📖 Lesson'}
                  </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quiz.scope === 'lesson' && quiz.lesson?.title
                          ? `${quiz.lesson.title}`
                          : quiz.scope === 'course' && quiz.course?.title
                          ? `${quiz.course.title}`
                          : 'Unassigned'
                        }
                      </div>
                      {quiz.scope === 'lesson' && quiz.lesson?.course?.title && (
                        <div className="text-xs text-gray-500">
                          Course: {quiz.lesson.course.title}
                </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {quiz.pass_percent}% pass
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {quiz.max_points} pts
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {quiz.feedback_mode === 'at_end' ? 'Feedback at end' : 'Immediate feedback'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm"
                          onClick={() => openEditDialog(quiz)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50 shadow-sm"
                          onClick={() => openDeleteDialog(quiz)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}