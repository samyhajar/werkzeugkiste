'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import type { Database } from '@/types/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Module = Database['public']['Tables']['modules']['Row']

interface ModuleWithCourses extends Module {
  courses?: Course[]
}

interface ApiResponse<T> {
  success: boolean
  error?: string
  module?: T
  courses?: Course[]
}

export default function ModuleManagePage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<ModuleWithCourses | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    hero_image: '',
    status: 'draft' as 'draft' | 'published'
  })

  const fetchModule = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as ApiResponse<ModuleWithCourses>

      if (data.success && data.module) {
        setModule(data.module)
        setCourses(data.courses || [])
        setEditForm({
          title: data.module.title,
          description: data.module.description || '',
          hero_image: data.module.hero_image || '',
          status: (data.module.status as 'draft' | 'published') || 'draft'
        })
      } else {
        throw new Error(data.error || 'Failed to load module')
      }
    } catch (err) {
      console.error('Error fetching module:', err)
      setError(err instanceof Error ? err.message : 'Failed to load module')
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  const updateModule = async () => {
    if (!editForm.title.trim()) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as ApiResponse<ModuleWithCourses>

      if (data.success && data.module) {
        setModule(data.module)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to update module')
      }
    } catch (err) {
      console.error('Error updating module:', err)
      setError(err instanceof Error ? err.message : 'Failed to update module')
    } finally {
      setSaving(false)
    }
  }

  const deleteModule = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as ApiResponse<ModuleWithCourses>

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

  useEffect(() => {
    if (moduleId) {
      void fetchModule()
    }
  }, [moduleId, fetchModule])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading module...</span>
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
            <div className="text-red-600 mb-2">Failed to load module</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => void fetchModule()}
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

  if (!module) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-gray-500">Module not found</div>
          <Button
            onClick={() => router.push('/admin/modules')}
            className="mt-4"
            variant="outline"
          >
            Back to Modules
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              onClick={() => router.push('/admin/modules')}
              variant="outline"
              size="sm"
            >
              ← Back to Modules
            </Button>
            <Badge variant={module.status === 'published' ? 'default' : 'secondary'}>
              {module.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
          <p className="text-gray-600 mt-2">
            Manage module details and associated courses
          </p>
        </div>
        <Button
          onClick={() => router.push(`/modules/${moduleId}`)}
          variant="outline"
          className="border-[#486681] text-[#486681] hover:bg-[#486681]/10"
        >
          Preview Module
        </Button>
      </div>

      {/* Module Edit Form */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
          <CardDescription>
            Update the module information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Enter module title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Enter module description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero_image">Hero Image URL</Label>
            <Input
              id="hero_image"
              value={editForm.hero_image}
              onChange={(e) => setEditForm({ ...editForm, hero_image: e.target.value })}
              placeholder="Enter image URL (optional)"
            />
            {editForm.hero_image && (
              <div className="mt-2">
                <img
                  src={editForm.hero_image}
                  alt="Hero preview"
                  className="w-32 h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={editForm.status}
              onValueChange={(value: 'draft' | 'published') =>
                setEditForm({ ...editForm, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={saving || deleting}
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
                        <strong>⚠️ Important:</strong> This will delete the module but will NOT delete its associated courses. Those courses will remain in the system but will no longer be grouped under this module.
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
                      void deleteModule()
                    }}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete Module'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => void updateModule()}
              disabled={saving || !editForm.title.trim()}
              className="bg-[#486681] hover:bg-[#3e5570] text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Courses in this Module</h2>
          <Button
            asChild
            className="bg-[#486681] hover:bg-[#3e5570] text-white"
          >
            <Link href={`/admin/courses/new?module_id=${moduleId}`}>
              Add Course
            </Link>
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">No courses in this module yet</div>
              <Button
                asChild
                className="bg-[#486681] hover:bg-[#3e5570] text-white"
              >
                <Link href={`/admin/courses/new?module_id=${moduleId}`}>
                  Create First Course
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="shadow-sm hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                  {course.description && (
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created {formatDistanceToNow(new Date(course.created_at || ''), { addSuffix: true })}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 bg-[#486681] hover:bg-[#3e5570] text-white">
                      <Link href={`/admin/courses/${course.id}`}>
                        Manage
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-[#486681] text-[#486681] hover:bg-[#486681]/10">
                      <Link href={`/admin/courses/${course.id}/lessons`}>
                        Lessons
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Published Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {courses.filter(c => c.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Draft Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {courses.filter(c => c.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}