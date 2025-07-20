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
  content: string | null
  course_id: string
  sort_order: number
  admin_id: string | null
  created_at: string
  updated_at: string
  course: Course
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '',
    course_id: '',
    sort_order: 0
  })

  const fetchLessons = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLessons(data.lessons || [])
      } else {
        throw new Error(data.error || 'Failed to fetch lessons')
      }
    } catch (err) {
      console.error('Error fetching lessons:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lessons')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCourses(data.courses || [])
        }
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  const createLesson = async () => {
    if (!newLesson.title.trim() || !newLesson.course_id) {
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newLesson),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLessons([data.lesson, ...lessons])
        setNewLesson({ title: '', content: '', course_id: '', sort_order: 0 })
        setIsCreateDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to create lesson')
      }
    } catch (err) {
      console.error('Error creating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to create lesson')
    } finally {
      setCreating(false)
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = courseFilter === 'all' || lesson.course_id === courseFilter
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
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading lessons...</span>
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
            <div className="text-red-600 mb-2">Failed to load lessons</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchLessons()}
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
          <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
          <p className="text-gray-600 mt-2">
            Manage lessons across all courses
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486682] hover:bg-[#3e5570] text-white shadow-sm">
              <span className="mr-2">📖</span>
              Create New Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#486682] to-[#3e5570] rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📖</span>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Create New Lesson</DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Add a new learning lesson with content and organize it within a course
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Course Selection Card */}
              <div className="bg-gradient-to-r from-white to-orange-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📚</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Course Assignment</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-semibold text-gray-700">Select Course *</Label>
                  <Select
                    value={newLesson.course_id}
                    onValueChange={(value) => setNewLesson({ ...newLesson, course_id: value })}
                  >
                    <SelectTrigger className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20">
                      <SelectValue placeholder="Choose a course for this lesson" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <span>📚</span>
                            <span>{course.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lesson Info Card */}
              <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#486682] rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Lesson Information</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Lesson Title *</Label>
                    <Input
                      id="title"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      placeholder="e.g., Introduction to Social Media Marketing"
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-sm font-semibold text-gray-700">Lesson Content</Label>
                    <Textarea
                      id="content"
                      value={newLesson.content}
                      onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                      placeholder="Write your lesson content here. You can include text, links, and instructions..."
                      rows={4}
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                    />
                    <p className="text-xs text-gray-500">This content will be displayed to students when they access the lesson</p>
                  </div>
                </div>
              </div>

              {/* Organization Card */}
              <div className="bg-gradient-to-r from-white to-purple-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Organization</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order" className="text-sm font-semibold text-gray-700">Sort Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={newLesson.sort_order}
                    onChange={(e) => setNewLesson({ ...newLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first (0 = first lesson, 1 = second, etc.)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                  className="sm:w-auto w-full"
                >
                  <span className="mr-2">❌</span>
                  Cancel
                </Button>
                <Button
                  onClick={createLesson}
                  disabled={creating || !newLesson.title.trim() || !newLesson.course_id}
                  className="bg-[#486682] hover:bg-[#3e5570] text-white sm:w-auto w-full"
                >
                  {creating ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Creating Lesson...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Create Lesson
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={courseFilter}
          onValueChange={(value: string) => setCourseFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {lessons.length === 0 ? 'No lessons created yet' : 'No lessons match your search'}
          </div>
          {lessons.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486682] hover:bg-[#3e5570] text-white">
              Create Your First Lesson
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="shadow-sm hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <Badge variant="outline">
                    #{lesson.sort_order}
                  </Badge>
                </div>
                <CardDescription>
                  Course: {lesson.course?.title || 'Unknown'}
                </CardDescription>
                {lesson.content && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {lesson.content}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created {formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 bg-[#486682] hover:bg-[#3e5570] text-white">
                    <Link href={`/admin/courses/${lesson.course_id}/lessons/${lesson.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-[#486682] text-[#486682] hover:bg-[#486682]/10">
                    <Link href={`/admin/courses/${lesson.course_id}/lessons/${lesson.id}/quizzes`}>
                      Quizzes
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