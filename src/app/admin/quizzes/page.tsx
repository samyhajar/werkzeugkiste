'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

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
  lesson_id: string
  questions: QuizQuestion[]
  admin_id: string | null
  created_at: string
  updated_at: string
  lesson: Lesson
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lessonFilter, setLessonFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newQuiz, setNewQuiz] = useState<{
    title: string
    description: string
    lesson_id: string
    pass_percentage: number
    questions: QuizQuestion[]
  }>({
    title: '',
    description: '',
    lesson_id: '',
    pass_percentage: 80,
    questions: []
  })

  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    question_text: '',
    explanation: '',
    options: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  })

  const fetchQuizzes = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setQuizzes(data.quizzes || [])
      } else {
        throw new Error(data.error || 'Failed to fetch quizzes')
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLessons(data.lessons || [])
        }
      }
    } catch (err) {
      console.error('Error fetching lessons:', err)
    }
  }

  const addQuestion = () => {
    const newQuestionData = {
      ...currentQuestion,
      id: Date.now(), // temporary ID for display
      sort_order: newQuiz.questions.length
    }

    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, newQuestionData]
    })

    // Reset current question form
    setCurrentQuestion({
      type: 'multiple_choice',
      question_text: '',
      explanation: '',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    })
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = newQuiz.questions.filter((_, i) => i !== index)
    setNewQuiz({
      ...newQuiz,
      questions: updatedQuestions
    })
  }

  const updateQuestionType = (type: 'multiple_choice' | 'true_false' | 'short_answer') => {
    let newOptions = currentQuestion.options

    if (type === 'true_false') {
      newOptions = [
        { text: 'True', is_correct: false },
        { text: 'False', is_correct: false }
      ]
    } else if (type === 'short_answer') {
      newOptions = []
    } else if (type === 'multiple_choice' && currentQuestion.type !== 'multiple_choice') {
      newOptions = [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }

    setCurrentQuestion({
      ...currentQuestion,
      type,
      options: newOptions
    })
  }

  const updateOption = (index: number, text: string) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index] = { ...newOptions[index], text }
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  const toggleCorrectAnswer = (index: number) => {
    const newOptions = [...currentQuestion.options]

    if (currentQuestion.type === 'multiple_choice') {
      // For multiple choice, only one answer can be correct
      newOptions.forEach((option, i) => {
        option.is_correct = i === index
      })
    } else if (currentQuestion.type === 'true_false') {
      // For true/false, only one answer can be correct
      newOptions.forEach((option, i) => {
        option.is_correct = i === index
      })
    }

    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, { text: '', is_correct: false }]
      })
    }
  }

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index)
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions
      })
    }
  }

  const createQuiz = async () => {
    if (!newQuiz.title.trim() || !newQuiz.lesson_id) {
      return
    }

    setCreating(true)

    try {
      const quizData = {
        ...newQuiz,
        pass_percentage: newQuiz.pass_percentage
      }

      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(quizData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setQuizzes([data.quiz, ...quizzes])
        setNewQuiz({ title: '', description: '', lesson_id: '', pass_percentage: 80, questions: [] })
        setCurrentQuestion({
          type: 'multiple_choice',
          question_text: '',
          explanation: '',
          options: [
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        })
        setIsCreateDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to create quiz')
      }
    } catch (err) {
      console.error('Error creating quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to create quiz')
    } finally {
      setCreating(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLesson = lessonFilter === 'all' || quiz.lesson_id === lessonFilter
    return matchesSearch && matchesLesson
  })

  useEffect(() => {
    fetchQuizzes()
    fetchLessons()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading quizzes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load quizzes</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchQuizzes()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600 mt-2">
            Manage quizzes across all lessons
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486682] hover:bg-[#3e5570] text-white shadow-sm">
              <span className="mr-2">❓</span>
              Create New Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col mx-4">
            <DialogHeader className="text-center pb-4 flex-shrink-0">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486682] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-lg">❓</span>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Create New Quiz</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create an assessment quiz to test student understanding within a lesson
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
              {/* Lesson Selection Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📖</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Lesson Assignment</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="lesson" className="text-xs font-semibold text-gray-700">Select Lesson *</Label>
                  <Select
                    value={newQuiz.lesson_id}
                    onValueChange={(value) => setNewQuiz({ ...newQuiz, lesson_id: value })}
                  >
                    <SelectTrigger className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 h-9 text-sm">
                      <SelectValue placeholder="Choose a lesson for this quiz" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          <div className="flex items-center gap-2">
                            <span>📖</span>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{lesson.title}</span>
                              <span className="text-xs text-gray-500">{lesson.course?.title || 'Unknown Course'}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Select the lesson where this quiz will appear</p>
                </div>
              </div>

              {/* Quiz Info Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486682] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Quiz Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs font-semibold text-gray-700">Quiz Title *</Label>
                    <Input
                      id="title"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                      placeholder="e.g., Social Media Marketing Knowledge Check"
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                      placeholder="Describe the purpose and scope of this quiz. What will students be tested on?"
                      rows={2}
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500">This description helps students understand what the quiz covers</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pass_percentage" className="text-xs font-semibold text-gray-700">Pass Percentage</Label>
                    <Input
                      id="pass_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={newQuiz.pass_percentage}
                      onChange={(e) => setNewQuiz({ ...newQuiz, pass_percentage: parseInt(e.target.value) || 80 })}
                      placeholder="80"
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm h-9"
                    />
                    <p className="text-xs text-gray-500">Percentage needed to pass this quiz</p>
                  </div>
                </div>
              </div>

              {/* Question Creation Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">❓</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Add Questions</h3>
                </div>

                {/* Current Questions List */}
                {newQuiz.questions.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Current Questions ({newQuiz.questions.length})</p>
                    {newQuiz.questions.map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{question.question_text || 'Untitled Question'}</p>
                          <p className="text-xs text-gray-500 capitalize">{question.type.replace('_', ' ')}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Question Type Selection */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Question Type</Label>
                    <Select value={currentQuestion.type} onValueChange={updateQuestionType}>
                      <SelectTrigger className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="short_answer">Short Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Question Text</Label>
                    <Textarea
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                      placeholder="Enter your question here..."
                      rows={2}
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm resize-none"
                    />
                  </div>

                  {/* Answer Options */}
                  {currentQuestion.type !== 'short_answer' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-gray-700">Answer Options</Label>
                        {currentQuestion.type === 'multiple_choice' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                            disabled={currentQuestion.options.length >= 6}
                            className="h-6 text-xs"
                          >
                            + Add Option
                          </Button>
                        )}
                      </div>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Button
                            variant={option.is_correct ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCorrectAnswer(index)}
                            className={`h-6 w-6 p-0 ${option.is_correct ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50'}`}
                          >
                            {option.is_correct ? '✓' : '○'}
                          </Button>
                          <Input
                            value={option.text}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm h-8"
                          />
                          {currentQuestion.type === 'multiple_choice' && currentQuestion.options.length > 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        Click the circle (○) to mark the correct answer
                      </p>
                    </div>
                  )}

                  {/* Question Explanation */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Explanation (Optional)</Label>
                    <Textarea
                      value={currentQuestion.explanation}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                      placeholder="Explain why this is the correct answer..."
                      rows={2}
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20 text-sm resize-none"
                    />
                  </div>

                  {/* Add Question Button */}
                  <Button
                    onClick={addQuestion}
                    disabled={!currentQuestion.question_text.trim() ||
                      (currentQuestion.type !== 'short_answer' && !currentQuestion.options.some(opt => opt.is_correct))}
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-sm border-green-200 text-green-700 hover:bg-green-50"
                  >
                    + Add This Question
                  </Button>
                </div>
              </div>

              {/* Quiz Settings Info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">What&apos;s Next?</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#486682] text-sm">🎯</span>
                    <span className="font-medium text-gray-900 text-xs">After creating the quiz</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-6">
                    <li>• Questions will be saved with the quiz</li>
                    <li>• Students can take the quiz and get instant results</li>
                    <li>• You can edit questions after creating the quiz</li>
                    <li>• Track student performance and analytics</li>
                  </ul>
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
                onClick={createQuiz}
                disabled={creating || !newQuiz.title.trim() || !newQuiz.lesson_id || newQuiz.questions.length === 0}
                className="bg-[#486682] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
              >
                {creating ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Create Quiz
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={lessonFilter}
          onValueChange={(value: string) => setLessonFilter(value)}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lessons</SelectItem>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {quizzes.length === 0 ? 'No quizzes created yet' : 'No quizzes match your search'}
          </div>
          {quizzes.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486682] hover:bg-[#3e5570] text-white">
              Create Your First Quiz
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="shadow-sm hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <Badge variant="outline">
                    {quiz.questions?.length || 0} questions
                  </Badge>
                </div>
                <CardDescription>
                  Lesson: {quiz.lesson?.title || 'Unknown'}
                </CardDescription>
                <CardDescription className="text-xs">
                  Course: {quiz.lesson?.course?.title || 'Unknown'}
                </CardDescription>
                {quiz.description && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 bg-[#486682] hover:bg-[#3e5570] text-white">
                    <Link href={`/admin/courses/${quiz.lesson?.course?.id}/lessons/${quiz.lesson_id}/quizzes/${quiz.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-[#486682] text-[#486682] hover:bg-[#486682]/10">
                    <Link href={`/admin/courses/${quiz.lesson?.course?.id}/lessons/${quiz.lesson_id}/quizzes/${quiz.id}`}>
                      Questions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}