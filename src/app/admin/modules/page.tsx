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

interface Module {
  id: string
  title: string
  description: string | null
  hero_image: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
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
    status: 'draft' as 'draft' | 'published'
  })

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

      const data = await response.json()

      if (data.success) {
        setModules(data.modules || [])
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

  const createModule = async () => {
    if (!newModule.title.trim()) {
      return
    }

    setCreating(true)

    try {
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

      const data = await response.json()

      if (data.success) {
        setModules([data.module, ...modules])
        setNewModule({ title: '', description: '', hero_image: '', status: 'draft' })
        setIsCreateDialogOpen(false)
      } else {
        throw new Error(data.error || 'Failed to create module')
      }
    } catch (err) {
      console.error('Error creating module:', err)
      setError(err instanceof Error ? err.message : 'Failed to create module')
    } finally {
      setCreating(false)
    }
  }

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || module.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchModules()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading modules...</span>
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
            <div className="text-red-600 mb-2">Failed to load modules</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchModules()}
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
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          <p className="text-gray-600 mt-2">
            Manage learning modules and organize your courses
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#486682] hover:bg-[#3e5570] text-white shadow-sm">
              <span className="mr-2">📦</span>
              Create New Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#486682] to-[#3e5570] rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📦</span>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Create New Module</DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Create a learning module to organize and group related courses together
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Module Info Card */}
              <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#486682] rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Module Information</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Module Title *</Label>
                    <Input
                      id="title"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      placeholder="e.g., Digital Marketing Fundamentals"
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                    <Textarea
                      id="description"
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      placeholder="Describe what this module covers and its learning objectives..."
                      rows={3}
                      className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Design Card */}
              <div className="bg-gradient-to-r from-white to-green-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🎨</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Visual Design</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image" className="text-sm font-semibold text-gray-700">Hero Image URL</Label>
                  <Input
                    id="hero_image"
                    value={newModule.hero_image}
                    onChange={(e) => setNewModule({ ...newModule, hero_image: e.target.value })}
                    placeholder="https://example.com/module-image.jpg (optional)"
                    className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
                  />
                  <p className="text-xs text-gray-500">Add an image to make your module more engaging (recommended size: 800x400px)</p>
                </div>
              </div>

              {/* Settings Card */}
              <div className="bg-gradient-to-r from-white to-purple-50/30 rounded-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Module Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Publication Status</Label>
                  <Select
                    value={newModule.status}
                    onValueChange={(value: 'draft' | 'published') =>
                      setNewModule({ ...newModule, status: value })
                    }
                  >
                    <SelectTrigger className="border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20">
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

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={creating}
                  className="sm:w-auto w-full"
                >
                  <span className="mr-2">❌</span>
                  Cancel
                </Button>
                <Button
                  onClick={createModule}
                  disabled={creating || !newModule.title.trim()}
                  className="bg-[#486682] hover:bg-[#3e5570] text-white sm:w-auto w-full"
                >
                  {creating ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Creating Module...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Create Module
                    </>
                  )}
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
            placeholder="Search modules..."
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
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {modules.length === 0 ? 'No modules created yet' : 'No modules match your search'}
          </div>
          {modules.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#486682] hover:bg-[#3e5570] text-white">
              Create Your First Module
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card key={module.id} className="shadow-sm hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <Badge variant={module.status === 'published' ? 'default' : 'secondary'}>
                    {module.status}
                  </Badge>
                </div>
                {module.description && (
                  <CardDescription className="line-clamp-2">
                    {module.description}
                  </CardDescription>
                )}
                {module.hero_image && (
                  <div className="mt-2">
                    <img
                      src={module.hero_image}
                      alt={module.title}
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created {formatDistanceToNow(new Date(module.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 bg-[#486682] hover:bg-[#3e5570] text-white">
                    <Link href={`/admin/modules/${module.id}`}>
                      Manage
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="border-[#486682] text-[#486682] hover:bg-[#486682]/10">
                    <Link href={`/modules/${module.id}`}>
                      Preview
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