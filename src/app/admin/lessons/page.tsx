'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
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
import Link from 'next/link'

type Lesson = Tables<'lessons'>
type Course = Tables<'courses'>

interface LessonWithCourse extends Lesson {
  courses: Course | null
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonWithCourse[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonWithCourse | null>(null)
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '' as string | null,
    course_id: '' as string | null,
    sort_order: 0,
    video_url: '' as string | null
  })

  const supabase = getBrowserClient()

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          courses (*)
        `)
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

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title')

      if (error) {
        console.error('Error fetching courses:', error)
        return
      }

      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
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
        .select()

      if (error) {
        console.error('Error creating lesson:', error)
        return
      }

      if (data) {
        // Refetch to get the course data
        await fetchLessons()
        setNewLesson({ title: '', content: '', course_id: '', sort_order: 0, video_url: '' })
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
        .select()

      if (error) {
        console.error('Error updating lesson:', error)
        return
      }

      if (data) {
        // Refetch to get updated data
        await fetchLessons()
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
    }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return

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
                         lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = courseFilter === 'all' || (courseFilter === 'none' ? !lesson.course_id : lesson.course_id === courseFilter)
    return matchesSearch && matchesCourse
  })

  useEffect(() => {
    fetchLessons()
    fetchCourses()
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
            <h1 className="text-3xl font-bold tracking-tight">Lectures</h1>
            <p className="text-foreground/60">
              Manage your lectures and assign them to courses
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Lecture
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Lecture</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Enter lecture title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newLesson.content || ''}
                    onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                    placeholder="Enter lecture content"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={newLesson.course_id || 'none'} onValueChange={(value) => setNewLesson({ ...newLesson, course_id: value === 'none' ? null : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={newLesson.sort_order}
                    onChange={(e) => setNewLesson({ ...newLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="video_url">Video URL (Optional)</Label>
                  <Input
                    id="video_url"
                    value={newLesson.video_url || ''}
                    onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createLesson} disabled={!newLesson.title.trim()}>
                  Create Lecture
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
                  placeholder="Search lectures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={courseFilter} onValueChange={(value) => setCourseFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="none">No Course</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
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
            <CardTitle>Lectures ({filteredLessons.length})</CardTitle>
            <CardDescription>
              Manage your lectures and their course assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLessons.length === 0 ? (
              <div className="text-center py-8 text-foreground/60">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No lectures found</p>
                <p className="text-sm">Create your first lecture to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order</th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Course</th>
                      <th className="text-left p-2">Content Preview</th>
                      <th className="text-left p-2">Video</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map((lesson) => (
                      <tr key={lesson.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">{lesson.sort_order}</td>
                        <td className="p-2 font-medium">{lesson.title}</td>
                        <td className="p-2">
                          {lesson.courses ? (
                            <Badge variant="outline">{lesson.courses.title}</Badge>
                          ) : (
                            <span className="text-foreground/40">No course</span>
                          )}
                        </td>
                        <td className="p-2 text-sm text-foreground/70 max-w-xs truncate">
                          {lesson.content ?
                            (lesson.content.length > 50 ? `${lesson.content.substring(0, 50)}...` : lesson.content)
                            : 'No content'
                          }
                        </td>
                        <td className="p-2">
                          {lesson.video_url ? (
                            <Badge variant="secondary">Has Video</Badge>
                          ) : (
                            <span className="text-foreground/40">No video</span>
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
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Lecture</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    placeholder="Enter lecture title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingLesson.content || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value || null })}
                    placeholder="Enter lecture content"
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-course">Course</Label>
                  <Select value={editingLesson.course_id || 'none'} onValueChange={(value) => setEditingLesson({ ...editingLesson, course_id: value === 'none' ? null : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sort_order">Order</Label>
                  <Input
                    id="edit-sort_order"
                    type="number"
                    value={editingLesson.sort_order}
                    onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-video_url">Video URL (Optional)</Label>
                  <Input
                    id="edit-video_url"
                    value={editingLesson.video_url || ''}
                    onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value || null })}
                    placeholder="https://..."
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
                      content: editingLesson.content || undefined,
                      course_id: editingLesson.course_id,
                      sort_order: editingLesson.sort_order,
                      video_url: editingLesson.video_url || undefined
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