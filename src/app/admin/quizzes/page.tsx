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

interface Quiz {
  id: string
  title: string
  description: string | null
  lesson_id: string
  questions: any[]
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
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    lesson_id: '',
    questions: []
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

  const createQuiz = async () => {
    if (!newQuiz.title.trim() || !newQuiz.lesson_id) {
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newQuiz),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setQuizzes([data.quiz, ...quizzes])
        setNewQuiz({ title: '', description: '', lesson_id: '', questions: [] })
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
                </div>
              </div>

              {/* Quiz Settings Info */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">What's Next?</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#486682] text-sm">🎯</span>
                    <span className="font-medium text-gray-900 text-xs">After creating the quiz</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-6">
                    <li>• Add questions to make the quiz interactive</li>
                    <li>• Configure scoring and passing requirements</li>
                    <li>• Set time limits and attempt restrictions</li>
                    <li>• Preview the quiz before publishing</li>
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
                disabled={creating || !newQuiz.title.trim() || !newQuiz.lesson_id}
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