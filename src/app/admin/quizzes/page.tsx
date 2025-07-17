'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tables } from '@/types/supabase'
import { formatDistanceToNow } from 'date-fns'

type Quiz = Tables<'quizzes'>
type Lesson = Tables<'lessons'>

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lessonFilter, setLessonFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    lesson_id: '',
    pass_pct: 70
  })

  const supabase = createClient()

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*, lessons(title)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching quizzes:', error)
        return
      }

      setQuizzes(data || [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('title', { ascending: true })

      if (error) {
        console.error('Error fetching lessons:', error)
        return
      }

      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  const createQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert([{
          title: newQuiz.title,
          description: newQuiz.description || null,
          lesson_id: newQuiz.lesson_id || null,
          pass_pct: newQuiz.pass_pct
        }])
        .select('*, lessons(title)')

      if (error) {
        console.error('Error creating quiz:', error)
        return
      }

      if (data) {
        setQuizzes([data[0], ...quizzes])
        setNewQuiz({ title: '', description: '', lesson_id: '', pass_pct: 70 })
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
    }
  }

  const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select('*, lessons(title)')

      if (error) {
        console.error('Error updating quiz:', error)
        return
      }

      if (data) {
        setQuizzes(quizzes.map(quiz =>
          quiz.id === id ? { ...quiz, ...data[0] } : quiz
        ))
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
    }
  }

  const deleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting quiz:', error)
        return
      }

      setQuizzes(quizzes.filter(quiz => quiz.id !== id))
    } catch (error) {
      console.error('Error deleting quiz:', error)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLesson = lessonFilter === 'all' || quiz.lesson_id === lessonFilter
    return matchesSearch && matchesLesson
  })

  const getLessonTitle = (lessonId: string | null) => {
    if (!lessonId) return 'No Lesson'
    const lesson = lessons.find(l => l.id === lessonId)
    return lesson?.title || 'Unknown Lesson'
  }

  useEffect(() => {
    fetchQuizzes()
    fetchLessons()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-foreground/60">
              Manage your quizzes and link them to lessons
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    placeholder="Enter quiz title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lesson_id">Lesson</Label>
                  <Select value={newQuiz.lesson_id} onValueChange={(value) => setNewQuiz({ ...newQuiz, lesson_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Lesson</SelectItem>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pass_pct">Pass Percentage</Label>
                  <Input
                    id="pass_pct"
                    type="number"
                    min="0"
                    max="100"
                    value={newQuiz.pass_pct}
                    onChange={(e) => setNewQuiz({ ...newQuiz, pass_pct: parseInt(e.target.value) || 70 })}
                    placeholder="Enter pass percentage"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createQuiz} disabled={!newQuiz.title.trim()}>
                  Create Quiz
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={lessonFilter} onValueChange={setLessonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lessons</SelectItem>
                    <SelectItem value="">No Lesson</SelectItem>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes ({filteredQuizzes.length})</CardTitle>
            <CardDescription>
              Manage your quizzes and their lesson assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-8 text-foreground/60">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p>No quizzes found</p>
                <p className="text-sm">Create your first quiz to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Lesson</th>
                      <th className="text-left p-2">Pass %</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuizzes.map((quiz) => (
                      <tr key={quiz.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{quiz.title}</td>
                        <td className="p-2 text-sm text-foreground/70 max-w-xs truncate">
                          {quiz.description || 'No description'}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {getLessonTitle(quiz.lesson_id)}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-foreground/70">
                          {quiz.pass_pct || 70}%
                        </td>
                        <td className="p-2 text-sm text-foreground/70">
                          {quiz.created_at ? formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true }) : 'Unknown'}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingQuiz(quiz)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuiz(quiz.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingQuiz && (
          <Dialog open={!!editingQuiz} onOpenChange={() => setEditingQuiz(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Quiz</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                    placeholder="Enter quiz title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingQuiz.description || ''}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-lesson_id">Lesson</Label>
                  <Select
                    value={editingQuiz.lesson_id || ''}
                    onValueChange={(value) => setEditingQuiz({ ...editingQuiz, lesson_id: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Lesson</SelectItem>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-pass_pct">Pass Percentage</Label>
                  <Input
                    id="edit-pass_pct"
                    type="number"
                    min="0"
                    max="100"
                    value={editingQuiz.pass_pct || 70}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, pass_pct: parseInt(e.target.value) || 70 })}
                    placeholder="Enter pass percentage"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingQuiz(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await updateQuiz(editingQuiz.id, {
                      title: editingQuiz.title,
                      description: editingQuiz.description,
                      lesson_id: editingQuiz.lesson_id,
                      pass_pct: editingQuiz.pass_pct
                    })
                    setEditingQuiz(null)
                  }}
                  disabled={!editingQuiz.title.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}