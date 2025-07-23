'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateSafely } from '@/lib/utils'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [sortField, setSortField] = useState<'title' | 'content' | 'course' | 'created_at'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchLessons = useCallback(async () => {
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
  }, [])

  const fetchCourses = useCallback(async () => {
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
  }, [])

  const createLesson = useCallback(async () => {
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
  }, [newLesson, lessons])

  // Optimized input handlers
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLesson(prev => ({ ...prev, title: e.target.value }))
  }, [])

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewLesson(prev => ({ ...prev, content: e.target.value }))
  }, [])

  const handleCourseChange = useCallback((value: string) => {
    setNewLesson(prev => ({ ...prev, course_id: value }))
  }, [])

  const handleSortOrderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLesson(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleCourseFilterChange = useCallback((value: string) => {
    setCourseFilter(value)
  }, [])

  const deleteLesson = useCallback(async () => {
    if (!lessonToDelete) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/lessons/${lessonToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLessons(lessons.filter(l => l.id !== lessonToDelete.id))
        setDeleteDialogOpen(false)
        setLessonToDelete(null)
      } else {
        throw new Error(data.error || 'Failed to delete lesson')
      }
    } catch (err) {
      console.error('Error deleting lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
    } finally {
      setDeleting(false)
    }
  }, [lessonToDelete, lessons])

  const openDeleteDialog = useCallback((lesson: Lesson) => {
    setLessonToDelete(lesson)
    setDeleteDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((lesson: Lesson) => {
    setEditingLesson(lesson)
    setIsEditDialogOpen(true)
  }, [])

  const handleSort = useCallback((field: 'title' | 'content' | 'course' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  const getSortedLessons = useCallback(() => {
    const filteredLessons = lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (lesson.content && lesson.content.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCourse = courseFilter === 'all' || lesson.course_id === courseFilter
      return matchesSearch && matchesCourse
    })

    return filteredLessons.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'content':
          aValue = (a.content || '').toLowerCase()
          bValue = (b.content || '').toLowerCase()
          break
        case 'course':
          aValue = (a.course?.title || '').toLowerCase()
          bValue = (b.course?.title || '').toLowerCase()
          break

        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
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
  }, [lessons, searchTerm, courseFilter, sortField, sortDirection])

  const updateLesson = useCallback(async () => {
    if (!editingLesson || !editingLesson.title.trim()) {
      return
    }

    setEditing(true)

    try {
      const response = await fetch(`/api/admin/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editingLesson.title,
          content: editingLesson.content,
          course_id: editingLesson.course_id,
          sort_order: editingLesson.sort_order
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLessons(lessons.map(l => l.id === editingLesson.id ? editingLesson : l))
        setIsEditDialogOpen(false)
        setEditingLesson(null)
      } else {
        throw new Error(data.error || 'Failed to update lesson')
      }
    } catch (err) {
      console.error('Error updating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to update lesson')
    } finally {
      setEditing(false)
    }
  }, [editingLesson, lessons])

  // Memoized dialog content component
  const CreateLessonDialogContent = memo(() => (
    <>
      <DialogHeader className="text-center pb-4 flex-shrink-0">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
          <span className="text-white text-lg">📖</span>
        </div>
        <DialogTitle className="text-xl font-bold text-gray-900">Create New Lesson</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          Add a new learning lesson with content and organize it within a course
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
        {/* Course Selection Card */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">📚</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Course Assignment</h3>
          </div>

          <div className="space-y-1">
            <Label htmlFor="course" className="text-xs font-semibold text-gray-700">Select Course *</Label>
            <Select
              value={newLesson.course_id}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
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
            <p className="text-xs text-gray-500">Select the course where this lesson will appear</p>
          </div>
        </div>

        {/* Lesson Info Card */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
              <span className="text-white text-xs">📝</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Lesson Information</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-semibold text-gray-700">Lesson Title *</Label>
              <Input
                id="title"
                value={newLesson.title}
                onChange={handleTitleChange}
                placeholder="e.g., Introduction to Social Media Marketing"
                className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="content" className="text-xs font-semibold text-gray-700">Lesson Content</Label>
              <Textarea
                id="content"
                value={newLesson.content}
                onChange={handleContentChange}
                placeholder="Write your lesson content here. You can include text, links, and instructions..."
                rows={3}
                className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm resize-none"
              />
              <p className="text-xs text-gray-500">This content will be displayed to students when they access the lesson</p>
            </div>
          </div>
        </div>

        {/* Organization Card */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Organization</h3>
          </div>

          <div className="space-y-1">
            <Label htmlFor="order" className="text-xs font-semibold text-gray-700">Sort Order</Label>
            <Input
              id="order"
              type="number"
              value={newLesson.sort_order}
              onChange={handleSortOrderChange}
              placeholder="0"
              className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
            />
            <p className="text-xs text-gray-500">Lower numbers appear first (0 = first lesson, 1 = second, etc.)</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed Footer */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 flex-shrink-0 mt-4">
        <Button
          variant="outline"
          onClick={() => setIsCreateDialogOpen(false)}
          disabled={creating}
          className="sm:w-auto w-full h-9 text-sm"
        >
          <span className="mr-2">❌</span>
          Cancel
        </Button>
        <Button
          onClick={createLesson}
          disabled={creating || !newLesson.title.trim() || !newLesson.course_id}
          className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
        >
          {creating ? (
            <>
              <span className="mr-2 animate-spin">⏳</span>
              Creating...
            </>
          ) : (
            <>
              <span className="mr-2">✨</span>
              Create Lesson
            </>
          )}
        </Button>
      </div>
    </>
  ))

  CreateLessonDialogContent.displayName = 'CreateLessonDialogContent'

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCourse = courseFilter === 'all' || lesson.course_id === courseFilter
      return matchesSearch && matchesCourse
    })
  }, [lessons, searchTerm, courseFilter])

  useEffect(() => {
    void fetchLessons()
    void fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading lessons...</span>
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
            <div className="text-red-600 mb-2">Failed to load lessons</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => void fetchLessons()}
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
          <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
          <p className="text-gray-600 mt-2">
            Manage lessons across all courses
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm">
              <span className="mr-2">📖</span>
              Create New Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col mx-4" showCloseButton={false}>
            <CreateLessonDialogContent />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20"
            />
          </div>
          <Select
            value={courseFilter}
            onValueChange={handleCourseFilterChange}
          >
            <SelectTrigger className="w-[200px] h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lessons Table */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500 mb-4 text-lg">
            {lessons.length === 0 ? 'No lessons created yet' : 'No lessons match your search'}
          </div>
          {lessons.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486681] hover:bg-[#3e5570] text-white px-6 py-3">
              Create Your First Lesson
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
                      Lektion
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('content')}
                  >
                    <div className="flex items-center gap-2">
                      Inhalt
                      {sortField === 'content' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('course')}
                  >
                    <div className="flex items-center gap-2">
                      Kurs
                      {sortField === 'course' && (
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
                {getSortedLessons().map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="bg-white hover:bg-gray-100 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                          {lesson.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {lesson.content || 'Kein Inhalt verfügbar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lesson.course?.title || 'Unbekannt'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateSafely(lesson.created_at, { locale: 'de' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white"
                          onClick={() => openEditDialog(lesson)}
                        >
                          Verwalten
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(lesson)}
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
            <DialogTitle className="text-red-600">Lektion löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie die Lektion &quot;{lessonToDelete?.title}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setLessonToDelete(null)
              }}
              disabled={deleting}
              className="sm:w-auto w-full"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => void deleteLesson()}
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

      {/* Edit Lesson Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col mx-4">
          <DialogHeader className="text-center pb-4 flex-shrink-0">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
              <span className="text-white text-lg">✏️</span>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">Lektion bearbeiten</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Bearbeiten Sie die Informationen der Lektion &quot;{editingLesson?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          {editingLesson && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
              {/* Course Selection Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📚</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Kurs Zuweisung</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-course" className="text-xs font-semibold text-gray-700">Kurs auswählen *</Label>
                  <Select
                    value={editingLesson.course_id}
                    onValueChange={(value) => setEditingLesson({ ...editingLesson, course_id: value })}
                  >
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue placeholder="Wählen Sie einen Kurs für diese Lektion" />
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
                  <p className="text-xs text-gray-500">Wählen Sie den Kurs, in dem diese Lektion erscheinen soll</p>
                </div>
              </div>

              {/* Lesson Info Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Lektion Informationen</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-title" className="text-xs font-semibold text-gray-700">Lektion Titel *</Label>
                    <Input
                      id="edit-title"
                      value={editingLesson.title}
                      onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                      placeholder="e.g., Introduction to Social Media Marketing"
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-content" className="text-xs font-semibold text-gray-700">Lektion Inhalt</Label>
                    <Textarea
                      id="edit-content"
                      value={editingLesson.content || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                      placeholder="Schreiben Sie Ihren Lektionsinhalt hier. Sie können Text, Links und Anweisungen einbeziehen..."
                      rows={3}
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500">Dieser Inhalt wird den Studenten angezeigt, wenn sie auf die Lektion zugreifen</p>
                  </div>
                </div>
              </div>

              {/* Organization Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📋</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Organisation</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-order" className="text-xs font-semibold text-gray-700">Sortierreihenfolge</Label>
                  <Input
                    id="edit-order"
                    type="number"
                    value={editingLesson.sort_order}
                    onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                  />
                  <p className="text-xs text-gray-500">Niedrigere Zahlen erscheinen zuerst (0 = erste Lektion, 1 = zweite, usw.)</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Fixed Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100 flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingLesson(null)
              }}
              disabled={editing}
              className="sm:w-auto w-full h-9 text-sm"
            >
              <span className="mr-2">❌</span>
              Abbrechen
            </Button>
            <Button
              onClick={() => void updateLesson()}
              disabled={editing || !editingLesson?.title.trim() || !editingLesson?.course_id}
              className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
            >
              {editing ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Wird aktualisiert...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}