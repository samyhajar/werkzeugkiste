'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Database } from '@/types/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Module = Database['public']['Tables']['modules']['Row']

interface ApiResponse<T> {
  success: boolean
  error?: string
  courses?: T[]
  course?: T
  modules?: T[]
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module_id: '',
    hero_image: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [sortField, setSortField] = useState<'title' | 'description' | 'module' | 'status' | 'created_at'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }

      const result = await response.json() as ApiResponse<Course>

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

      const result = await response.json() as ApiResponse<Module>

      if (!result.success || !result.modules) {
        throw new Error(result.error || 'Failed to fetch modules')
      }

      setModules(result.modules)
    } catch (err) {
      console.error('Error fetching modules:', err)
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
    if (!formData.title.trim()) return

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCourses([data.course, ...courses])
        setFormData({
          title: '',
          description: '',
          module_id: '',
          hero_image: '',
        })
        setCreateModalOpen(false)
      } else {
        throw new Error(data.error || 'Failed to create course')
      }
    } catch (err) {
      console.error('Error creating course:', err)
      setError(err instanceof Error ? err.message : 'Failed to create course')
    }
  }

  const deleteCourse = async () => {
    if (!courseToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCourses(courses.filter(c => c.id !== courseToDelete.id))
        setDeleteDialogOpen(false)
        setCourseToDelete(null)
      } else {
        throw new Error(data.error || 'Failed to delete course')
      }
    } catch (err) {
      console.error('Error deleting course:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (course: Course) => {
    setCourseToDelete(course)
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setIsEditDialogOpen(true)
  }

  const handleSort = (field: 'title' | 'description' | 'module' | 'status' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedCourses = () => {
    return courses.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'description':
          aValue = (a.description || '').toLowerCase()
          bValue = (b.description || '').toLowerCase()
          break
        case 'module':
          const moduleA = modules.find(m => m.id === a.module_id)
          const moduleB = modules.find(m => m.id === b.module_id)
          aValue = (moduleA?.title || '').toLowerCase()
          bValue = (moduleB?.title || '').toLowerCase()
          break
        case 'status':
          aValue = a.status || 'draft'
          bValue = b.status || 'draft'
          break
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime()
          bValue = new Date(b.created_at || '').getTime()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const updateCourse = async () => {
    if (!editingCourse || !editingCourse.title.trim()) {
      return
    }

    setEditing(true)

    try {
      const response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editingCourse.title,
          description: editingCourse.description,
          module_id: editingCourse.module_id,
          hero_image: editingCourse.hero_image,
          status: editingCourse.status
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCourses(courses.map(c => c.id === editingCourse.id ? editingCourse : c))
        setIsEditDialogOpen(false)
        setEditingCourse(null)
      } else {
        throw new Error(data.error || 'Failed to update course')
      }
    } catch (err) {
      console.error('Error updating course:', err)
      setError(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setEditing(false)
    }
  }

  const filteredCourses = getSortedCourses().filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading courses...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load courses</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => void fetchCourses()}
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
    <div className="w-full px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kurse</h1>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre Lernkurse
          </p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              + Kurs erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col mx-4">
            <DialogHeader className="text-center pb-4 flex-shrink-0">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-lg">📚</span>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Create New Course</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Create a new learning course to add to your platform
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
              {/* Course Info Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Course Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs font-semibold text-gray-700">Course Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Digital Marketing Fundamentals"
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this course covers and its learning objectives..."
                      rows={3}
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Module Assignment Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📦</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Module Assignment</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="module_id" className="text-xs font-semibold text-gray-700">Select Module</Label>
                  <Select value={formData.module_id} onValueChange={(value) => setFormData({ ...formData, module_id: value })}>
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue placeholder="Choose a module for this course" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex items-center gap-2">
                            <span>📦</span>
                            <span>{module.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Choose the module where this course should appear</p>
                </div>
              </div>

              {/* Visual Design Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">🎨</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Visual Design</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="hero_image" className="text-xs font-semibold text-gray-700">Hero Image URL</Label>
                  <Input
                    id="hero_image"
                    value={formData.hero_image}
                    onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                  />
                  <p className="text-xs text-gray-500">Optional: Add a hero image for the course</p>
                </div>
              </div>
            </form>

            <DialogFooter className="flex-shrink-0 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={loading}
                className="sm:w-auto w-full h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !formData.title.trim()}
                className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
              >
                {loading ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Create Course
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Kurse suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'published' | 'draft') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px] h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all">Alle Kurse</SelectItem>
              <SelectItem value="published">Veröffentlicht</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Table */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500 mb-4 text-lg">
            {courses.length === 0 ? 'No courses created yet' : 'No courses match your search'}
          </div>
          {courses.length === 0 && (
            <Button onClick={() => setCreateModalOpen(true)} className="bg-[#486681] hover:bg-[#3e5570] text-white px-6 py-3">
              Erstellen Sie Ihren ersten Kurs
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#486681] to-[#3e5570]">
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Kursname
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Beschreibung
                      {sortField === 'description' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('module')}
                  >
                    <div className="flex items-center gap-2">
                      Modul
                      {sortField === 'module' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Erstellt
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="bg-white hover:bg-gray-100 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {course.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {course.description || 'Keine Beschreibung verfügbar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const moduleItem = modules.find(m => m.id === course.module_id)
                          return moduleItem?.title || 'Nicht zugewiesen'
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={course.status === 'published' ? 'default' : 'secondary'}
                        className={
                          course.status === 'published'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {course.status || 'draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {course.created_at
                          ? formatDistanceToNow(new Date(course.created_at), {
                              addSuffix: true,
                              locale: de,
                            })
                          : 'Unbekannt'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white"
                          onClick={() => openEditDialog(course)}
                        >
                          Verwalten
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(course)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Kurs löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie den Kurs &quot;{courseToDelete?.title}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCourseToDelete(null)
              }}
              disabled={deleting}
              className="sm:w-auto w-full"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => void deleteCourse()}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white sm:w-auto w-full"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen bestätigen
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col mx-4">
          <DialogHeader className="text-center pb-4 flex-shrink-0">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-lg">✏️</span>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Course</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Update course information and settings
            </DialogDescription>
          </DialogHeader>

          {editingCourse && (
            <div className="space-y-6 overflow-y-auto flex-1 pr-2 -mr-2">
              {/* Course Information Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Course Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-title" className="text-xs font-semibold text-gray-700">Course Title *</Label>
                    <Input
                      id="edit-title"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                      placeholder="e.g., Social Media Marketing Basics"
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-description" className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editingCourse.description || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      placeholder="Describe what this course covers and its learning objectives..."
                      rows={2}
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Module Assignment Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📚</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Module Assignment</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-module" className="text-xs font-semibold text-gray-700">Select Module</Label>
                  <Select
                    value={editingCourse.module_id || ''}
                    onValueChange={(value) => setEditingCourse({ ...editingCourse, module_id: value })}
                  >
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue placeholder="Choose a module for this course" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex items-center gap-2">
                            <span>📦</span>
                            <span>{module.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Choose the module where this course should appear</p>
                </div>
              </div>

              {/* Visual Design Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">🎨</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Visual Design</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-hero_image" className="text-xs font-semibold text-gray-700">Hero Image URL</Label>
                  <Input
                    id="edit-hero_image"
                    value={editingCourse.hero_image || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, hero_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                  />
                  <p className="text-xs text-gray-500">Optional: Add a hero image for the course</p>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Course Status</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-status" className="text-xs font-semibold text-gray-700">Status</Label>
                  <Select
                    value={editingCourse.status || 'draft'}
                    onValueChange={(value: 'draft' | 'published') => setEditingCourse({ ...editingCourse, status: value })}
                  >
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Set the course visibility status</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingCourse(null)
              }}
              disabled={editing}
              className="sm:w-auto w-full h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void updateCourse()}
              disabled={editing || !editingCourse?.title.trim()}
              className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
            >
              {editing ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Update Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}