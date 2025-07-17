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
import RichTextEditor from '@/components/ui/rich-text-editor'

type Lesson = Tables<'lessons'>
type Course = Tables<'courses'>

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [modules, setModules] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [newLesson, setNewLesson] = useState({
    title: '',
    markdown: '',
    video_url: '',
    course_id: '',
    sort_order: 0
  })

  const supabase = createClient()

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, courses(title)')
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching lessons:', error)
        return
      }

      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true })

      if (error) {
        console.error('Error fetching modules:', error)
        return
      }

      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

  const createLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          ...newLesson,
          course_id: newLesson.course_id || null
        }])
        .select('*, courses(title)')

      if (error) {
        console.error('Error creating lesson:', error)
        return
      }

      if (data) {
        setLessons([...lessons, data[0]])
        setNewLesson({ title: '', markdown: '', video_url: '', course_id: '', sort_order: 0 })
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  const updateLesson = async (id: string, updates: Partial<Lesson>) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select('*, courses(title)')

      if (error) {
        console.error('Error updating lesson:', error)
        return
      }

      if (data) {
        setLessons(lessons.map(lesson =>
          lesson.id === id ? { ...lesson, ...data[0] } : lesson
        ))
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting lesson:', error)
        return
      }

      setLessons(lessons.filter(lesson => lesson.id !== id))
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.markdown?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = moduleFilter === 'all' || lesson.course_id === moduleFilter
    return matchesSearch && matchesModule
  })

  const getModuleTitle = (courseId: string | null) => {
    if (!courseId) return 'No Module'
    const module = modules.find(m => m.id === courseId)
    return module?.title || 'Unknown Module'
  }

  useEffect(() => {
    fetchLessons()
    fetchModules()
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
            <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
            <p className="text-foreground/60">
              Manage your lessons and link them to modules
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Enter lesson title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <RichTextEditor
                    content={newLesson.markdown || ''}
                    onChange={(value) => setNewLesson({ ...newLesson, markdown: value })}
                    placeholder="Enter lesson content..."
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    value={newLesson.video_url}
                    onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                    placeholder="Enter video URL (optional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course_id">Module</Label>
                  <Select value={newLesson.course_id} onValueChange={(value) => setNewLesson({ ...newLesson, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Module</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={newLesson.sort_order}
                    onChange={(e) => setNewLesson({ ...newLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="Enter sort order"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createLesson} disabled={!newLesson.title.trim()}>
                  Create Lesson
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
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="">No Module</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lessons ({filteredLessons.length})</CardTitle>
            <CardDescription>
              Manage your lessons and their module assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLessons.length === 0 ? (
              <div className="text-center py-8 text-foreground/60">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No lessons found</p>
                <p className="text-sm">Create your first lesson to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Module</th>
                      <th className="text-left p-2">Sort Order</th>
                      <th className="text-left p-2">Has Video</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map((lesson) => (
                      <tr key={lesson.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{lesson.title}</td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {getModuleTitle(lesson.course_id)}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-foreground/70">
                          {lesson.sort_order || 0}
                        </td>
                        <td className="p-2">
                          {lesson.video_url ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </td>
                        <td className="p-2 text-sm text-foreground/70">
                          {lesson.created_at ? formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true }) : 'Unknown'}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingLesson(lesson)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLesson(lesson.id)}
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
        {editingLesson && (
          <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Lesson</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    placeholder="Enter lesson title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <RichTextEditor
                    content={editingLesson.markdown || ''}
                    onChange={(value) => setEditingLesson({ ...editingLesson, markdown: value })}
                    placeholder="Enter lesson content..."
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-video_url">Video URL</Label>
                  <Input
                    id="edit-video_url"
                    value={editingLesson.video_url || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                    placeholder="Enter video URL (optional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-course_id">Module</Label>
                  <Select
                    value={editingLesson.course_id || ''}
                    onValueChange={(value) => setEditingLesson({ ...editingLesson, course_id: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select module (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Module</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sort_order">Sort Order</Label>
                  <Input
                    id="edit-sort_order"
                    type="number"
                    value={editingLesson.sort_order || 0}
                    onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="Enter sort order"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingLesson(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await updateLesson(editingLesson.id, {
                      title: editingLesson.title,
                      markdown: editingLesson.markdown,
                      video_url: editingLesson.video_url,
                      course_id: editingLesson.course_id,
                      sort_order: editingLesson.sort_order
                    })
                    setEditingLesson(null)
                  }}
                  disabled={!editingLesson.title.trim()}
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