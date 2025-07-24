'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Database } from '@/types/supabase'

type Module = Database['public']['Tables']['modules']['Row']

interface ApiResponse<T> {
  success: boolean
  error?: string
  modules?: T[]
  module?: T
}

// Helper function to safely format dates
const formatDateSafely = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown date'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: de })
  } catch (_error) {
    return 'Invalid date'
  }
}

export default function ModulesPage() {
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [courses, setCourses] = useState<Database['public']['Tables']['courses']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    hero_image: '',
    status: 'draft' as 'draft' | 'published',
    course_id: ''
  })

  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null)
  const [sortField, setSortField] = useState<'title' | 'description' | 'status' | 'created_at' | 'updated_at'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchModules = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/modules', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as ApiResponse<Module>

      if (data.success && data.modules) {
        setModules(data.modules)
      } else {
        throw new Error(data.error || 'Failed to fetch modules')
      }
    } catch (err) {
      console.error('Error fetching modules:', err)
      setError(err instanceof Error ? err.message : 'Failed to load modules')
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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.courses) {
        setCourses(data.courses)
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  const createModule = async () => {
    if (!newModule.title.trim() || (!editingModule && !newModule.course_id)) {
      return
    }

    setCreating(true)

    try {
      if (editingModule) {
        // Update existing module
        const response = await fetch(`/api/admin/modules/${editingModule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: newModule.title,
            description: newModule.description,
            hero_image: newModule.hero_image,
            status: newModule.status
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json() as ApiResponse<Module>

        if (data.success) {
          setModules(modules.map(m => m.id === editingModule.id ? { ...editingModule, ...newModule } : m))
          setNewModule({ title: '', description: '', hero_image: '', status: 'draft', course_id: '' })
          setIsCreateDialogOpen(false)
          setEditingModule(null)
        } else {
          throw new Error(data.error || 'Failed to update module')
        }
      } else {
        // Create new module
        const response = await fetch('/api/admin/modules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(newModule),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json() as ApiResponse<Module>

        if (data.success && data.module) {
          setModules([data.module, ...modules])
          setNewModule({ title: '', description: '', hero_image: '', status: 'draft', course_id: '' })
          setIsCreateDialogOpen(false)
        } else {
          throw new Error(data.error || 'Failed to create module')
        }
      }
    } catch (err) {
      console.error('Error saving module:', err)
      setError(err instanceof Error ? err.message : 'Failed to save module')
    } finally {
      setCreating(false)
    }
  }

  const deleteModule = async () => {
    if (!moduleToDelete) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/modules/${moduleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json() as ApiResponse<Module>

      if (data.success) {
        setModules(modules.filter(m => m.id !== moduleToDelete.id))
        setDeleteDialogOpen(false)
        setModuleToDelete(null)
      } else {
        throw new Error(data.error || 'Failed to delete module')
      }
    } catch (err) {
      console.error('Error deleting module:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete module')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (module: Module) => {
    setModuleToDelete(module)
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (module: Module) => {
    setNewModule({
      title: module.title,
      description: module.description || '',
      hero_image: module.hero_image || '',
      status: (module.status as 'draft' | 'published') || 'draft',
      course_id: ''
    })
    setEditingModule(module)
    setIsCreateDialogOpen(true)
  }

  const handleSort = (field: 'title' | 'description' | 'status' | 'created_at' | 'updated_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedModules = () => {
    const filteredModules = modules.filter(module => {
      const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (module.description && module.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || module.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return filteredModules.sort((a, b) => {
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
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime()
          bValue = new Date(b.created_at || '').getTime()
          break
        case 'updated_at':
          aValue = new Date(a.updated_at || '').getTime()
          bValue = new Date(b.updated_at || '').getTime()
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



  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || module.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    void fetchModules()
    void fetchCourses()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading modules...</span>
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
            <div className="text-red-600 mb-2">Failed to load modules</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => void fetchModules()}
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
    <div className="w-full px-8 py-8 space-y-8 bg-transparent min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Module</h1>
          <p className="text-gray-600 mt-2">
                          Verwalten Sie Lernmodule und organisieren Sie Ihre Kurse
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Neues Modul erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col mx-4">
            <DialogHeader className="text-center pb-4 flex-shrink-0">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#486681] to-[#3e5570] rounded-full flex items-center justify-center mb-3">
                <span className="text-white text-lg">📦</span>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingModule ? 'Edit Module' : 'Create New Module'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {editingModule ? 'Update the module information' : 'Create a learning module to organize and group related courses together'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
              {/* Module Info Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-[#486681] rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Module Information</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs font-semibold text-gray-700">Module Title *</Label>
                    <Input
                      id="title"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      placeholder="e.g., Digital Marketing Fundamentals"
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      placeholder="Describe what this module covers and its learning objectives..."
                      rows={2}
                      className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm resize-none"
                    />
                  </div>
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
                    value={newModule.hero_image}
                    onChange={(e) => setNewModule({ ...newModule, hero_image: e.target.value })}
                    placeholder="https://example.com/module-image.jpg (optional)"
                    className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 text-sm h-9"
                  />
                  <p className="text-xs text-gray-500">Add an image to make your module more engaging (800x400px)</p>
                </div>
              </div>

              {/* Course Assignment Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">📚</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Course Assignment</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="course_id" className="text-xs font-semibold text-gray-700">Select Course</Label>
                  <Select
                    value={newModule.course_id}
                    onValueChange={(value) => setNewModule({ ...newModule, course_id: value })}
                  >
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue placeholder="Choose a course for this module" />
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
                  <p className="text-xs text-gray-500">Choose the course where this module should appear</p>
                </div>
              </div>

              {/* Settings Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Module Settings</h3>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-semibold text-gray-700">Publication Status</Label>
                  <Select
                    value={newModule.status}
                    onValueChange={(value: 'draft' | 'published') =>
                      setNewModule({ ...newModule, status: value })
                    }
                  >
                    <SelectTrigger className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <span>📝</span>
                          <span>Draft - Not visible to students</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <span>🌟</span>
                          <span>Published - Available to students</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                onClick={() => void createModule()}
                disabled={creating || !newModule.title.trim() || (!editingModule && !newModule.course_id)}
                className="bg-[#486681] hover:bg-[#3e5570] text-white sm:w-auto w-full h-9 text-sm"
              >
                {creating ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    {editingModule ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    {editingModule ? 'Update Module' : 'Create Module'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Module suchen..."
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
              <SelectItem value="all">Alle Module</SelectItem>
              <SelectItem value="published">Veröffentlicht</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modules Table */}
      {filteredModules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500 mb-4 text-lg">
            {modules.length === 0 ? 'No modules created yet' : 'No modules match your search'}
          </div>
          {modules.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486681] hover:bg-[#3e5570] text-white px-6 py-3">
              Erstellen Sie Ihr erstes Modul
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
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Modulname
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
                  <th
                    className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#3e5570] transition-colors"
                    onClick={() => handleSort('updated_at')}
                  >
                    <div className="flex items-center gap-2">
                      Aktualisiert
                      {sortField === 'updated_at' && (
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
                {getSortedModules().map((module) => (
                  <tr
                    key={module.id}
                    className="bg-white hover:bg-gray-100 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {module.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {module.description || 'No description available'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={module.status === 'published' ? 'default' : 'secondary'}
                        className={
                          module.status === 'published'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {module.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateSafely(module.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateSafely(module.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm"
                          onClick={() => openEditDialog(module)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#486681] text-[#486681] hover:bg-[#486681]/10 shadow-sm"
                          onClick={() => {
                            router.push(`/admin/modules/${module.id}`)
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(module)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 shadow-sm"
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
            <DialogTitle className="text-red-600">Modul löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie das Modul &quot;{moduleToDelete?.title}&quot; löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden und alle zugehörigen Kurse werden ebenfalls gelöscht.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setModuleToDelete(null)
              }}
              disabled={deleting}
              className="sm:w-auto w-full"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => void deleteModule()}
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


    </div>
  )
}