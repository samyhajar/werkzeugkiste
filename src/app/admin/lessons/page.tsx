'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import RichTextEditor from '@/components/ui/rich-text-editor'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

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
  const [sortField, setSortField] = useState<'title' | 'content' | 'course'>('title')
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

  // Optimized input handlers - immediate updates for controlled inputs
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLesson(prev => ({ ...prev, title: e.target.value }))
  }, [])



  const handleCourseChange = useCallback((value: string) => {
    setNewLesson(prev => ({ ...prev, course_id: value }))
  }, [])

  const handleSortOrderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLesson(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
  }, [])

  // Optimized search handler with immediate visual feedback
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [searchInputValue, setSearchInputValue] = useState('')

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Update input value immediately for visual feedback
    setSearchInputValue(value)

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setSearchTerm(value)
    }, 300) // Increased to 300ms for better performance
    setSearchTimeout(timeout)
  }, [searchTimeout])

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

  const handleSort = useCallback((field: 'title' | 'content' | 'course') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  const _getSortedLessons = useCallback(() => {
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
          aValue = (a.course?.title || 'Nicht zugewiesen').toLowerCase()
          bValue = (b.course?.title || 'Nicht zugewiesen').toLowerCase()
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



    // Optimized filtered lessons with memoization
  const filteredLessons = useMemo(() => {
    // Early return if no search term and no course filter
    if (!searchTerm && courseFilter === 'all') {
      return lessons
    }

    return lessons.filter(lesson => {
      let matchesSearch = true
      let matchesCourse = true

      // Only perform search if there's a search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        matchesSearch = lesson.title.toLowerCase().includes(searchLower) ||
                       (lesson.content && lesson.content.toLowerCase().includes(searchLower)) || false
      }

      // Only check course filter if it's not 'all'
      if (courseFilter !== 'all') {
        matchesCourse = lesson.course_id === courseFilter
      }

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
    <div className="w-full px-8 py-8 space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Lektionen</h1>
          <p className="text-white text-sm">
            Lektionen in allen Kursen verwalten
          </p>
        </div>
                {/* Custom Modal Trigger */}
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <span>📖</span>
          Create New Lesson
        </button>

        {/* Custom Modal Overlay */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsCreateDialogOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[85vh] min-h-[500px] flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📖</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Lesson</h2>
                    <p className="text-sm text-gray-600">Add a new learning lesson with content and organize it within a course</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6" style={{ minHeight: 0 }}>
                {/* Course Selection Card */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">📚</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Course Assignment</h3>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lesson-course-select" className="text-xs font-semibold text-gray-700 block">Select Course *</label>
                    <select
                      id="lesson-course-select"
                      value={newLesson.course_id}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, course_id: e.target.value }))}
                      className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
                    >
                      <option value="">Choose a course for this lesson</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          📚 {course.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">Select the course where this lesson will appear</p>
                  </div>
                </div>

                {/* Lesson Info Card */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">📝</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">Lesson Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="lesson-title-input" className="text-xs font-semibold text-gray-700 block">Lesson Title *</label>
                      <input
                        id="lesson-title-input"
                        type="text"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Introduction to Social Media Marketing"
                        className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lesson-content-editor" className="text-xs font-semibold text-gray-700 block">Lesson Content</label>
                      <div className="max-h-[300px] overflow-hidden">
                        <RichTextEditor
                          content={newLesson.content}
                          onChange={(content) => setNewLesson(prev => ({ ...prev, content }))}
                          placeholder="Write your lesson content here. You can include text, links, and instructions..."
                          className="min-h-[200px]"
                        />
                      </div>
                      <p className="text-xs text-gray-500">This content will be displayed to students when they access the lesson</p>
                    </div>
                  </div>
                </div>


              </div>

              {/* Footer - Fixed */}
              <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createLesson}
                  disabled={creating || !newLesson.title.trim() || !newLesson.course_id}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#486681] border border-transparent rounded-md hover:bg-[#3e5570] focus:outline-none focus:ring-2 focus:ring-[#486681]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      Create Lesson
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchInputValue}
              onChange={handleSearchChange}
              className="w-full h-12 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => handleCourseFilterChange(e.target.value)}
            className="w-[200px] h-12 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#486681] to-[#3e5570]">
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={handleSort.bind(null, 'title')}
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
                    onClick={handleSort.bind(null, 'content')}
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
                    onClick={handleSort.bind(null, 'course')}
                  >
                    <div className="flex items-center gap-2">
                      Kurs
                      {sortField === 'course' && (
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
                {filteredLessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="bg-white hover:bg-gray-100 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lesson.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {lesson.content || 'Kein Inhalt verfügbar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {lesson.course?.title || 'Nicht zugewiesen'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={openEditDialog.bind(null, lesson)}
                          className="px-3 py-1 text-sm bg-[#486681] hover:bg-[#3e5570] text-white rounded-md shadow-sm transition-colors"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={openDeleteDialog.bind(null, lesson)}
                          className="px-3 py-1 text-sm border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-md shadow-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {isEditDialogOpen && editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsEditDialogOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[85vh] min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✏️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lektion bearbeiten</h2>
                  <p className="text-sm text-gray-600">Bearbeiten Sie die Informationen der Lektion &quot;{editingLesson.title}&quot;</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6" style={{ minHeight: 0 }}>
              {/* Course Selection Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📚</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Kurs Zuweisung</h3>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-course-select" className="text-xs font-semibold text-gray-700 block">Kurs auswählen *</label>
                  <select
                    id="edit-course-select"
                    value={editingLesson.course_id}
                    onChange={(e) => editingLesson && setEditingLesson({ ...editingLesson, course_id: e.target.value })}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
                  >
                    <option value="">Wählen Sie einen Kurs für diese Lektion</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        📚 {course.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Wählen Sie den Kurs, in dem diese Lektion erscheinen soll</p>
                </div>
              </div>

              {/* Lesson Info Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Lektion Informationen</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="edit-title-input" className="text-xs font-semibold text-gray-700 block">Lektion Titel *</label>
                    <input
                      id="edit-title-input"
                      type="text"
                      value={editingLesson.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => editingLesson && setEditingLesson({ ...editingLesson, title: e.target.value })}
                      placeholder="e.g., Introduction to Social Media Marketing"
                      className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edit-content-editor" className="text-xs font-semibold text-gray-700 block">Lektion Inhalt</label>
                    <div className="max-h-[300px] overflow-hidden">
                      <RichTextEditor
                        content={editingLesson.content || ''}
                        onChange={(content) => setEditingLesson({ ...editingLesson!, content })}
                        placeholder="Schreiben Sie Ihren Lektionsinhalt hier. Sie können Text, Links und Anweisungen einbeziehen..."
                        className="min-h-[200px]"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Dieser Inhalt wird den Studenten angezeigt, wenn sie auf die Lektion zugreifen</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingLesson(null)
                  }}
                  disabled={editing}
                  className="sm:w-auto w-full h-11 px-6 text-base font-medium border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-2">❌</span>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => void updateLesson()}
                  disabled={editing || !editingLesson?.title.trim() || !editingLesson?.course_id}
                  className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-11 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}