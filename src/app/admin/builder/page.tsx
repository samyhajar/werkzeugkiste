'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, ChevronRight, GripVertical, Plus, Save, Trash2, Edit3, FileText, HelpCircle, BookOpen, FolderOpen, Folder } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BuilderElement {
  id: string
  type: 'module' | 'course' | 'lesson' | 'quiz' | 'section'
  title: string
  description?: string
  order: number
  parent_id?: string
  children?: BuilderElement[]
  isExpanded?: boolean
  db_id?: string
  db_type?: string
}

interface AvailableElement {
  id: string
  type: 'lesson' | 'quiz' | 'section'
  title: string
  description: string
  icon: React.ReactNode
}

// Sortable item component for builder elements
function SortableBuilderElement({ element, onRemove, onToggle, level = 0 }: {
  element: BuilderElement
  onRemove: (id: string) => void
  onToggle: (id: string) => void
  level?: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'module':
        return <FolderOpen className="w-4 h-4" />
      case 'course':
        return <Folder className="w-4 h-4" />
      case 'lesson':
        return <FileText className="w-4 h-4" />
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />
      case 'section':
        return <BookOpen className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getElementBadgeColor = (type: string) => {
    switch (type) {
      case 'module':
        return 'bg-orange-100 text-orange-800'
      case 'course':
        return 'bg-blue-100 text-blue-800'
      case 'lesson':
        return 'bg-green-100 text-green-800'
      case 'quiz':
        return 'bg-purple-100 text-purple-800'
      case 'section':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getElementTypeLabel = (type: string) => {
    switch (type) {
      case 'module':
        return 'Modul'
      case 'course':
        return 'Kurs'
      case 'lesson':
        return 'Lektion'
      case 'quiz':
        return 'Quiz'
      case 'section':
        return 'Abschnitt'
      default:
        return 'Element'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: `${level * 20}px` }}
      className={`mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm ${
        isDragging ? 'shadow-lg opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          </div>
          <div className="flex items-center gap-2">
            {element.children && element.children.length > 0 ? (
              <button
                onClick={() => onToggle(element.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {element.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            {getElementIcon(element.type)}
            <span className="font-medium">{element.title}</span>
            <Badge className={getElementBadgeColor(element.type)}>
              {getElementTypeLabel(element.type)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(element.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {element.isExpanded && element.children && element.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {element.children.map((child) => (
            <SortableBuilderElement
              key={child.id}
              element={child}
              onRemove={onRemove}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Draggable available element
function DraggableAvailableElement({ element }: { element: AvailableElement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move ${
        isDragging ? 'shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        {element.icon}
        <div className="flex-1">
          <h4 className="font-medium">{element.title}</h4>
          <p className="text-sm text-gray-600">{element.description}</p>
        </div>
        <Plus className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}

export default function BuilderPage() {
  const [builderElements, setBuilderElements] = useState<BuilderElement[]>([])
  const [availableElements, setAvailableElements] = useState<AvailableElement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Available elements that can be added
  const defaultAvailableElements: AvailableElement[] = [
    {
      id: 'new-lesson',
      type: 'lesson',
      title: 'Neue Lektion',
      description: 'Eine neue Lektion hinzufügen',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'new-quiz',
      type: 'quiz',
      title: 'Neues Quiz',
      description: 'Ein neues Quiz hinzufügen',
      icon: <HelpCircle className="w-4 h-4" />
    },
    {
      id: 'new-section',
      type: 'section',
      title: 'Neuer Abschnitt',
      description: 'Einen neuen Abschnitt hinzufügen',
      icon: <BookOpen className="w-4 h-4" />
    }
  ]

  useEffect(() => {
    setAvailableElements(defaultAvailableElements)
    loadEntireStructure()
  }, [])

  const loadEntireStructure = async () => {
    try {
      const response = await fetch('/api/admin/structure', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Transform the flat structure into hierarchical structure
          const hierarchicalElements = buildHierarchicalStructure(data.elements)
          setBuilderElements(hierarchicalElements)
        }
      }
    } catch (error) {
      console.error('Error loading structure:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildHierarchicalStructure = (flatElements: any[]): BuilderElement[] => {
    const elementsMap = new Map()
    const rootElements: BuilderElement[] = []

    // First pass: create all elements
    flatElements.forEach((element) => {
      elementsMap.set(element.id, {
        ...element,
        children: []
      })
    })

    // Second pass: build hierarchy
    flatElements.forEach((element) => {
      const currentElement = elementsMap.get(element.id)

      if (element.parent_id) {
        const parent = elementsMap.get(element.parent_id)
        if (parent) {
          parent.children.push(currentElement)
        }
      } else {
        rootElements.push(currentElement)
      }
    })

    return rootElements
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // Check if we're moving from available to builder
      const activeElement = availableElements.find(el => el.id === active.id)
      if (activeElement) {
        // Adding new element from available to builder
        const newElement: BuilderElement = {
          id: `${activeElement.type}-${Date.now()}`,
          type: activeElement.type,
          title: activeElement.title,
          description: activeElement.description,
          order: builderElements.length,
          children: []
        }
        setBuilderElements([...builderElements, newElement])
      } else {
        // Reordering within builder
        setBuilderElements((items) => {
          const oldIndex = items.findIndex(item => item.id === active.id)
          const newIndex = items.findIndex(item => item.id === over?.id)

          return arrayMove(items, oldIndex, newIndex).map((element, index) => ({
            ...element,
            order: index
          }))
        })
      }
    }

    setActiveId(null)
  }

  const toggleElementExpansion = (elementId: string) => {
    setBuilderElements(prev =>
      prev.map(element =>
        element.id === elementId
          ? { ...element, isExpanded: !element.isExpanded }
          : element
      )
    )
  }

  const removeElement = (elementId: string) => {
    setBuilderElements(prev => prev.filter(element => element.id !== elementId))
  }

  const saveStructure = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/structure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ elements: builderElements }),
      })

      if (response.ok) {
        // Show success message
        console.log('Structure saved successfully')
      }
    } catch (error) {
      console.error('Error saving structure:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Struktur wird geladen...</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Plattform-Builder</h1>
          <p className="text-gray-600 mt-2">Gesamte Lernplattform-Struktur verwalten</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={saveStructure}
            disabled={saving}
            className="bg-[#486681] hover:bg-[#3e5570] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Complete Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Gesamte Plattform-Struktur</CardTitle>
              <CardDescription>Hierarchische Ansicht: Module → Kurse → Lektionen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg p-4">
                {builderElements.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Keine Struktur gefunden</p>
                  </div>
                ) : (
                  <SortableContext items={builderElements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                    {builderElements.map((element) => (
                      <SortableBuilderElement
                        key={element.id}
                        element={element}
                        onRemove={removeElement}
                        onToggle={toggleElementExpansion}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Available Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Verfügbare Elemente</CardTitle>
              <CardDescription>Ziehen Sie diese Elemente in die Struktur</CardDescription>
            </CardHeader>
            <CardContent>
              <SortableContext items={availableElements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {availableElements.map((element) => (
                    <DraggableAvailableElement key={element.id} element={element} />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Element wird verschoben...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}