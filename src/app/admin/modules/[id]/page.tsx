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
import { GripVertical } from 'lucide-react'

type Module = Tables<'modules'>
type Course = Tables<'courses'>

interface CourseWithLessons extends Course {
  lessons: { id: string; title: string }[]
}

interface CourseWithStats extends Course {
  lesson_count: number
  lessons: any[]
}

export default function ModuleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [courses, setCourses] = useState<CourseWithStats[]>([])
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
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true)

        // Fetch module details
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single()

        if (moduleError) throw moduleError

        // Fetch courses assigned to this module
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            lessons(id, title)
          `)
          .eq('module_id', moduleId)
          .order('order', { ascending: true })

        if (coursesError) throw coursesError

        // Format courses data
        const coursesWithStats = coursesData.map((course: CourseWithLessons) => ({
          ...course,
          lesson_count: course.lessons ? course.lessons.length : 0,
          lessons: course.lessons || []
        })) as CourseWithStats[]

        setModule(moduleData)
        setCourses(coursesWithStats)
        setFormData({
          title: moduleData.title || '',
          description: moduleData.description || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch module')
      } finally {
        setLoading(false)
      }
    }

    void fetchModule()
  }, [moduleId, supabase])

  const handleSave = async () => {
    if (!module) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('modules')
        .update({
          title: formData.title,
          description: formData.description
        })
        .eq('id', moduleId)

      if (error) throw error

      setModule({ ...module, ...formData })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save module')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Redirect to modules list
        router.push('/admin/modules')
      } else {
        throw new Error(data.error || 'Failed to delete module')
      }
    } catch (err) {
      console.error('Error deleting module:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete module')
      setDeleting(false)
    }
  }

  const handleReorder = async (courseId: string, newOrder: number) => {
    setReordering(true)

    try {
      const response = await fetch('/api/admin/courses/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          newOrder
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Refresh the courses list
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            lessons(id, title)
          `)
          .eq('module_id', moduleId)
          .order('order', { ascending: true })

        if (!coursesError && coursesData) {
          const coursesWithStats = coursesData.map(course => ({
            ...course,
            lesson_count: course.lessons ? course.lessons.length : 0,
            lessons: course.lessons || []
          }))
          setCourses(coursesWithStats)
        }
      } else {
        throw new Error(data.error || 'Failed to reorder courses')
      }
    } catch (err) {
      console.error('Error reordering courses:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder courses')
    } finally {
      setReordering(false)
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
            <p className="text-destructive text-lg mb-4">Error loading module</p>
            <p className="text-foreground/60">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/admin/modules">Back to Modules</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-4">Module not found</p>
            <Button asChild>
              <Link href="/admin/modules">Back to Modules</Link>
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
              <Link href="/admin/modules">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Modules
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Module Details</h2>
              <p className="text-foreground/60">
                View and edit module information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={saving || deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Module
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Module</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p>Are you sure you want to delete this module?</p>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> This will delete the module but will NOT delete its courses. Those will remain in the system but will no longer be associated with this module.
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
                    onClick={() => {
                      setShowDeleteDialog(false)
                      handleDelete()
                    }}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? 'Deleting...' : 'Delete Module'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Module Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Module Information</CardTitle>
                <CardDescription>
                  Basic module details and settings
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
                    placeholder="Module title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Module description"
                    rows={4}
                  />
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Title</Label>
                  <p className="text-foreground">{module.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Description</Label>
                  <p className="text-foreground">{module.description || 'No description'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground/60">Created</Label>
                  <p className="text-foreground">
                    {module.created_at
                      ? formatDistanceToNow(new Date(module.created_at), { addSuffix: true })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Module Statistics</CardTitle>
            <CardDescription>
              Overview of module content and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">{courses.length}</div>
                <div className="text-sm text-foreground/60">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {courses.reduce((sum, course) => sum + course.lesson_count, 0)}
                </div>
                <div className="text-sm text-foreground/60">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">0</div>
                <div className="text-sm text-foreground/60">Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  Manage module courses and content
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/courses/new">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Course
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No courses yet</h3>
                <p className="text-foreground/60 mb-4">Start building your module by adding courses</p>
                <Button asChild>
                  <Link href="/admin/courses/new">Add First Course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course, index) => (
                  <div
                    key={`${course.id}-${index}`}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all cursor-move ${
                      draggedCourseId === course.id
                        ? 'bg-blue-100 border-blue-300 shadow-lg scale-105'
                        : 'bg-transparent hover:bg-gray-50'
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', course.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggedCourseId(course.id)
                    }}
                    onDragEnd={() => {
                      setDraggedCourseId(null)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (draggedCourseId && draggedCourseId !== course.id) {
                        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                      const draggedId = e.dataTransfer.getData('text/plain')
                      if (draggedId !== course.id) {
                        const draggedCourse = courses.find(c => c.id === draggedId)
                        if (draggedCourse) {
                          void handleReorder(draggedId, index)
                        }
                      }
                      setDraggedCourseId(null)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-brand-primary">
                          {index + 1}
                        </div>
                        <div className="w-6 h-6 text-gray-400">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{course.title}</h4>
                        <p className="text-sm text-foreground/60">
                          {course.lesson_count} lesson{course.lesson_count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/courses/${course.id}`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Course
                        </Link>
                      </Button>
                      {reordering && (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      )}
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