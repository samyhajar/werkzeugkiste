'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type _Lesson = Tables<'lessons'>
type _Quiz = Tables<'quizzes'>
type _Course = Tables<'courses'>

interface LessonWithJoins extends Tables<'lessons'> {
  course: Tables<'courses'>;
  quizzes: Tables<'quizzes'>[];
}

export default function LessonDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<LessonWithJoins | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    markdown: '',
    video_url: '',
    sort_order: 0
  })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true)

        // Fetch lesson with course and quizzes
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            course:courses(*),
            quizzes(*)
          `)
          .eq('id', lessonId)
          .single()

        if (lessonError) throw lessonError

        // Type guard for lessonData
        let typedLesson: LessonWithJoins | null = null;
        if (
          lessonData &&
          typeof lessonData === 'object' &&
          'id' in lessonData &&
          'course' in lessonData &&
          'quizzes' in lessonData
        ) {
          typedLesson = {
            ...(lessonData as Tables<'lessons'>),
            course: (lessonData as unknown as { course: Tables<'courses'> }).course,
            quizzes: Array.isArray((lessonData as unknown as { quizzes: Tables<'quizzes'>[] }).quizzes) && !('error' in (lessonData as unknown as { quizzes: Tables<'quizzes'>[] }).quizzes)
              ? (lessonData as unknown as { quizzes: Tables<'quizzes'>[] }).quizzes
              : [],
          }
        }
        if (typedLesson) {
          setLesson(typedLesson)
          setFormData({
            title: typedLesson.title || '',
            markdown: typedLesson.markdown || typedLesson.content || '',
            video_url: typedLesson.video_url || '',
            sort_order: typedLesson.sort_order || 0
          })
        } else {
          setError('Failed to fetch lesson: invalid data structure')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lesson')
      } finally {
        setLoading(false)
      }
    }

    void fetchLesson()
  }, [lessonId, supabase])

  const handleSave = async () => {
    if (!lesson) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('lessons')
        .update({
          title: formData.title,
          markdown: formData.markdown,
          video_url: formData.video_url || null,
          sort_order: formData.sort_order
        })
        .eq('id', lessonId)

      if (error) throw error

      setLesson({ ...lesson, ...formData })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error

      if (lesson) {
        setLesson({
          ...lesson,
          quizzes: lesson.quizzes.filter(quiz => quiz.id !== quizId)
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as { success: boolean; error?: string }

      if (data.success) {
        // Redirect back to course
        router.push(`/admin/courses/${courseId}`)
      } else {
        throw new Error(data.error || 'Failed to delete lesson')
      }
    } catch (err) {
      console.error('Error deleting lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
      setDeleting(false)
    }
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
            <p className="text-destructive text-lg mb-4">Error loading lesson</p>
            <p className="text-foreground/60">{error}</p>
            <Button asChild className="mt-4">
              <Link href={`/admin/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-4">Lesson not found</p>
            <Button asChild>
              <Link href={`/admin/courses/${courseId}`}>Back to Course</Link>
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
              <Link href={`/admin/courses/${courseId}`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Course
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Lesson Details</h2>
              <p className="text-foreground/60">
                {lesson.course.title} - Lesson {lesson.sort_order}
              </p>
            </div>
          </div>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={saving || deleting}
              >
                Delete Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Lesson</DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>Are you sure you want to delete this lesson?</p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Important:</strong> This will delete the lesson but will NOT delete its quizzes. Those will remain in the system but will no longer be associated with this lesson.
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
                    void handleDelete()
                  }}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Lesson'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lesson Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lesson Information</CardTitle>
                <CardDescription>
                  Lesson content and settings
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
                      onClick={() => void handleSave()}
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
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="markdown">Content (Markdown)</Label>
                  <Textarea
                    id="markdown"
                    value={formData.markdown}
                    onChange={(e) => setFormData({ ...formData, markdown: e.target.value })}
                    placeholder="Lesson content in markdown format"
                    rows={10}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Title</Label>
                  <p className="text-foreground">{lesson.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Video URL</Label>
                  <p className="text-foreground">{lesson.video_url || 'No video'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground/60">Sort Order</Label>
                    <p className="text-foreground">{lesson.sort_order}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground/60">Created</Label>
                    <p className="text-foreground">
                      {lesson.created_at
                        ? formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Content</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {lesson.markdown || 'No content'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quizzes</CardTitle>
                <CardDescription>
                  Manage quizzes for this lesson
                </CardDescription>
              </div>
              <Button asChild>
                <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/new`}>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Quiz
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lesson.quizzes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No quizzes yet</h3>
                <p className="text-foreground/60 mb-4">Add a quiz to test students&apos; understanding</p>
                <Button asChild>
                  <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/new`}>Add First Quiz</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {lesson.quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">{quiz.title}</h4>
                      <p className="text-sm text-foreground/60">
                        Pass percentage: {quiz.pass_percentage}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/${quiz.id}`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteQuiz(quiz.id)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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