'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import type {
  CoursesResponse,
  CourseResponse,
  ModulesResponse,
  CourseData,
  ModuleData
} from '@/types/api'

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [modules, setModules] = useState<ModuleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module_id: '',
    hero_image: '',
  })

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }

      const result = await response.json() as CoursesResponse

      if (!result.success || !result.courses) {
        throw new Error(result.error || 'Failed to fetch courses')
      }

      setCourses(result.courses)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses'
      console.error('Error fetching courses:', err)
      setError(errorMessage)
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`)
      }

      const result = await response.json() as ModulesResponse

      if (!result.success || !result.modules) {
        throw new Error(result.error || 'Failed to fetch modules')
      }

      setModules(result.modules)
    } catch (err) {
      console.error('Error fetching modules:', err)
    }
  }

  const createCourse = async (courseData: {
    title: string
    description: string
    module_id: string
    hero_image: string
  }) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(courseData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create course: ${response.status}`)
      }

      const result = await response.json() as CourseResponse

      if (!result.success || !result.course) {
        throw new Error(result.error || 'Failed to create course')
      }

      setCreateModalOpen(false)
      setFormData({ title: '', description: '', module_id: '', hero_image: '' })
      await Promise.all([fetchCourses(), fetchModules()])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course'
      console.error('Error creating course:', err)
      setError(errorMessage)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCourses(), fetchModules()])
      setLoading(false)
    }

    void loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCourse(formData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">Manage your learning courses</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#486681] hover:bg-[#3e5570] text-white"
        >
          Create Course
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <Badge
                  className={
                    course.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {course.status || 'draft'}
                </Badge>
              </div>
              {course.modules && (
                <CardDescription>Module: {course.modules.title}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {course.description || 'No description available'}
              </p>
              <div className="text-xs text-gray-500">
                Created {course.created_at ? formatDistanceToNow(new Date(course.created_at), { addSuffix: true }) : 'unknown'}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-[#486681] hover:bg-[#3e5570] text-white flex-1"
                  onClick={() => window.location.href = `/admin/courses/${course.id}`}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#486681] text-[#486681] hover:bg-[#486681]/10 flex-1"
                  onClick={() => window.location.href = `/admin/courses/${course.id}/builder`}
                >
                  Builder
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">Create your first course to get started.</p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#486681] hover:bg-[#3e5570] text-white"
          >
            Create Course
          </Button>
        </div>
      )}

      {/* Create Course Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to your learning platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter course title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter course description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module_id">Module</Label>
              <Select value={formData.module_id} onValueChange={(value) => setFormData({ ...formData, module_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_image">Hero Image URL</Label>
              <Input
                id="hero_image"
                value={formData.hero_image}
                onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#486681] hover:bg-[#3e5570] text-white">
                Create Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}