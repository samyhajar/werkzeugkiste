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
      if (response.ok) {
      const data = await response.json()
        setQuizzes(data.quizzes || [])
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
          <h1 className="text-3xl font-bold text-white">Enhanced Quizzes</h1>
          <p className="text-white mt-2">Manage course and lesson quizzes with advanced features</p>
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
                    Created
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quiz.created_at
                          ? formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })
                          : 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm"
                          onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#486681] text-[#486681] hover:bg-[#486681]/10 shadow-sm"
                          onClick={() => router.push(`/admin/quizzes/${quiz.id}/questions`)}
                        >
                          Questions
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