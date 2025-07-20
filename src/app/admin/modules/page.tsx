'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tables } from '@/types/supabase'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

type Module = Tables<'modules'>

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [newModule, setNewModule] = useState({
    title: '',
    description: '' as string | null,
    status: 'draft' as 'draft' | 'published'
  })

  const supabase = getBrowserClient()

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching modules:', error)
        return
      }

      setModules(data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const createModule = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([newModule])
        .select()

      if (error) {
        console.error('Error creating module:', error)
        return
      }

      if (data) {
        setModules([data[0], ...modules])
        setNewModule({ title: '', description: '', status: 'draft' })
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating module:', error)
    }
  }

  const updateModule = async (id: string, updates: Partial<Module>) => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error updating module:', error)
        return
      }

      if (data) {
        setModules(modules.map(module =>
          module.id === id ? { ...module, ...data[0] } : module
        ))
      }
    } catch (error) {
      console.error('Error updating module:', error)
    }
  }

  const deleteModule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all associated courses and lessons.')) return

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting module:', error)
        return
      }

      setModules(modules.filter(module => module.id !== id))
    } catch (error) {
      console.error('Error deleting module:', error)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
            <p className="text-foreground/60">
              Manage your learning modules - the top-level content containers
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    placeholder="Enter module title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newModule.description || ''}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    placeholder="Enter module description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newModule.status} onValueChange={(value: 'draft' | 'published') => setNewModule({ ...newModule, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createModule} disabled={!newModule.title.trim()}>
                  Create Module
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={(value: 'all' | 'published' | 'draft') => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Modules ({filteredModules.length})</CardTitle>
            <CardDescription>
              Manage your learning modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredModules.length === 0 ? (
              <div className="text-center py-8 text-foreground/60">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>No modules found</p>
                <p className="text-sm">Create your first module to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((module) => (
                      <tr key={module.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{module.title}</td>
                        <td className="p-2 text-sm text-foreground/70 max-w-xs truncate">
                          {module.description || 'No description'}
                        </td>
                        <td className="p-2">
                          <Badge variant={module.status === 'published' ? 'default' : 'secondary'}>
                            {module.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-foreground/70">
                          {module.created_at ? formatDistanceToNow(new Date(module.created_at), { addSuffix: true }) : 'Unknown'}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingModule(module)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateModule(module.id, {
                                status: module.status === 'published' ? 'draft' : 'published'
                              })}
                            >
                              {module.status === 'published' ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModule(module.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingModule && (
          <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Module</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                    placeholder="Enter module title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingModule.description || ''}
                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value || null })}
                    placeholder="Enter module description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingModule.status}
                    onValueChange={(value: 'draft' | 'published') => setEditingModule({ ...editingModule, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingModule(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await updateModule(editingModule.id, {
                      title: editingModule.title,
                      description: editingModule.description || undefined,
                      status: editingModule.status
                    })
                    setEditingModule(null)
                  }}
                  disabled={!editingModule.title.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}