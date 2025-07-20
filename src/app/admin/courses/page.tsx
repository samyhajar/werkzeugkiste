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
  description: string | null
  status: 'draft' | 'published'
  admin_id: string | null
  created_at: string
  updated_at: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'published'
  })

  const fetchCourses = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCourses(data.courses || [])
      } else {
        throw new Error(data.error || 'Failed to fetch courses')
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async () => {
    if (!newCourse.title.trim()) {
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newCourse),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCourses([data.course, ...courses])
        setNewCourse({ title: '', description: '', status: 'draft' })
        setIsCreateDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to create course')
      }
    } catch (err) {
      console.error('Error creating course:', err)
      setError(err instanceof Error ? err.message : 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading courses...</span>
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
            <div className="text-red-600 mb-2">Failed to load courses</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchCourses()}
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
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">
            Manage your learning courses and content
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486682] hover:bg-[#3e5570] text-white">Create New Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to your learning platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCourse.status}
                  onValueChange={(value: 'draft' | 'published') =>
                    setNewCourse({ ...newCourse, status: value })
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={createCourse} disabled={creating || !newCourse.title.trim()} className="bg-[#486682] hover:bg-[#3e5570] text-white">
                  {creating ? 'Creating...' : 'Create Course'}
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
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | 'published' | 'draft') => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {courses.length === 0 ? 'No courses created yet' : 'No courses match your search'}
          </div>
          {courses.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486682] hover:bg-[#3e5570] text-white">
              Create Your First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
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
                  <span>Created {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 bg-[#486682] hover:bg-[#3e5570] text-white">
                    <Link href={`/admin/courses/${course.id}`}>
                      Manage
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-[#486682] text-[#486682] hover:bg-[#486682]/10">
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
  )
}