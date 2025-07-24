'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronUp, ChevronDown } from 'lucide-react'

type Course = Tables<'courses'>
type Lesson = Tables<'lessons'>

interface LessonWithQuizCount extends Lesson {
  quiz_count: number
}

interface CourseWithStats extends Course {
  lesson_count: number
  lessons: LessonWithQuizCount[]
}

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<CourseWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (courseError) throw courseError

        // Fetch lessons with quiz counts
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select(`
            *,
            quizzes(id)
          `)
          .eq('course_id', courseId)
          .order('order', { ascending: true })

        if (lessonsError) throw lessonsError

        // Format lessons data
        const lessonsWithQuizCount = lessonsData.map(lesson => ({
          ...lesson,
          quiz_count: lesson.quizzes ? lesson.quizzes.length : 0
        }))

        const courseWithStats: CourseWithStats = {
          ...courseData,
          lesson_count: lessonsData.length,
          lessons: lessonsWithQuizCount
        }

        setCourse(courseWithStats)
        setFormData({
          title: courseData.title || '',
          description: courseData.description || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course')
      } finally {
        setLoading(false)
      }
    }

    void fetchCourse()
  }, [courseId, supabase])

  const handleSave = async () => {
    if (!course) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description
        })
        .eq('id', courseId)

      if (error) throw error

      setCourse({ ...course, ...formData })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Redirect to courses list
        router.push('/admin/courses')
      } else {
        throw new Error(data.error || 'Failed to delete course')
      }
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete course')
      setDeleting(false)
    }
  }

  const handleReorder = async (lessonId: string, newOrder: number) => {
    setReordering(true)

    try {
      const response = await fetch('/api/admin/lessons/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lessonId,
          newOrder
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Refresh the lessons list
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select(`
            *,
            quizzes(id)
          `)
          .eq('course_id', courseId)
          .order('order', { ascending: true })

        if (!lessonsError && lessonsData && course) {
          const lessonsWithQuizCount = lessonsData.map(lesson => ({
            ...lesson,
            quiz_count: lesson.quizzes ? lesson.quizzes.length : 0
          }))
          setCourse({
            ...course,
            lessons: lessonsWithQuizCount,
            lesson_count: lessonsWithQuizCount.length
          })
        }
      } else {
        throw new Error(data.error || 'Failed to reorder lessons')
      }
    } catch (err) {
      console.error('Error reordering lessons:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder lessons')
    } finally {
      setReordering(false)
    }
  }

    const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (!course) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === course.lessons.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const lesson = course.lessons[index]

    void handleReorder(lesson.id, newIndex)
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
            <p className="text-destructive text-lg mb-4">Error loading course</p>
            <p className="text-foreground/60">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/admin/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-4">Course not found</p>
            <Button asChild>
              <Link href="/admin/courses">Back to Courses</Link>
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
              <Link href="/admin/courses">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Courses
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Course Details</h2>
              <p className="text-foreground/60">
                View and edit course information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={saving || deleting}
                >
                  Delete Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Course</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p>Are you sure you want to delete this course?</p>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> This will delete the course but will NOT delete its lessons or quizzes. Those will remain in the system but will no longer be associated with this course.
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDeleteDialog(false)
                      handleDelete()
                    }}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Course'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Course Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Basic course details and settings
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
                      onClick={() => {
                        void handleSave()
                      }}
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
                    placeholder="Course title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description"
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Title</Label>
                  <p className="text-foreground">{course.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Description</Label>
                  <p className="text-foreground">{course.description || 'No description'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Created</Label>
                  <p className="text-foreground">
                    {course.created_at
                      ? formatDistanceToNow(new Date(course.created_at), { addSuffix: true })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Course Statistics</CardTitle>
            <CardDescription>
              Overview of course content and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">{course.lesson_count}</div>
                <div className="text-sm text-foreground/60">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {course.lessons.reduce((sum, lesson) => sum + lesson.quiz_count, 0)}
                </div>
                <div className="text-sm text-foreground/60">Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">0</div>
                <div className="text-sm text-foreground/60">Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lessons</CardTitle>
                <CardDescription>
                  Manage course lessons and content
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/lessons">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Lesson
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {course.lessons.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No lessons yet</h3>
                <p className="text-foreground/60 mb-4">Start building your course by adding lessons</p>
                <Button asChild>
                  <Link href="/admin/lessons">Add First Lesson</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg bg-transparent">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveLesson(index, 'up')}
                          disabled={index === 0 || reordering}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveLesson(index, 'down')}
                          disabled={index === course.lessons.length - 1 || reordering}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-brand-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{lesson.title}</h4>
                        <p className="text-sm text-foreground/60">
                          {lesson.quiz_count} quiz{lesson.quiz_count === 1 ? '' : 'zes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Lesson
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}