'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, GripVertical, Plus, Trash2, FileText, HelpCircle, BookOpen, FolderOpen } from 'lucide-react'
import { useTableSubscription } from '@/contexts/RealtimeContext'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

interface BuilderElement {
  id: string
  type: 'module' | 'course' | 'lesson' | 'quiz'
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
  type: 'course' | 'lesson' | 'quiz'
  title: string
  description: string
  icon: React.ReactNode
  db_id?: string
  db_type?: string
}

interface Course {
  id: string;
  title: string;
  description?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface StructureResponse extends ApiResponse<BuilderElement[]> {
  elements?: BuilderElement[];
}

interface AvailableElementsResponse extends ApiResponse<{
  unassignedCourses: Course[];
  unassignedLessons: Lesson[];
  unassignedQuizzes: Quiz[];
}> {
  unassignedCourses?: Course[];
  unassignedLessons?: Lesson[];
  unassignedQuizzes?: Quiz[];
}

// Helper functions
const getElementIcon = (type: string) => {
  switch (type) {
    case 'module':
      return <FolderOpen className="w-5 h-5 text-orange-600" />
    case 'course':
      return <BookOpen className="w-5 h-5 text-purple-600" />
    case 'lesson':
      return <FileText className="w-5 h-5 text-green-600" />
    case 'quiz':
      return <HelpCircle className="w-5 h-5 text-blue-600" />
    default:
      return <FileText className="w-5 h-5 text-gray-600" />
  }
}

const getElementBadgeColor = (type: string) => {
  switch (type) {
    case 'module':
      return 'bg-orange-100 text-orange-800'
    case 'course':
      return 'bg-purple-100 text-purple-800'
    case 'lesson':
      return 'bg-green-100 text-green-800'
    case 'quiz':
      return 'bg-blue-100 text-blue-800'
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
    default:
      return 'Element'
  }
}

const findElementById = (elements: (BuilderElement | AvailableElement)[], id: string): BuilderElement | AvailableElement | undefined => {
  for (const element of elements) {
    if (element.id === id) {
      return element
    }
    if ('children' in element && element.children) {
      const found = findElementById(element.children, id)
      if (found) return found
    }
  }
  return undefined
}

function SortableBuilderElement({ element, onRemove, onToggle, level = 0 }: {
  element: BuilderElement
  onRemove: (id: string) => Promise<void>
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

  const hasChildren = element.children && element.children.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className={`flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
          level > 0 ? 'ml-6' : ''
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 flex-1">
          {getElementIcon(element.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {element.title}
              </span>
              <Badge className={getElementBadgeColor(element.type)}>
                {getElementTypeLabel(element.type)}
              </Badge>
            </div>
            {element.description && (
              <p className="text-sm text-gray-600 truncate">
                {element.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(element.id)}
              className="p-1 h-8 w-8"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  element.isExpanded ? 'rotate-90' : ''
                }`}
              />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onRemove(element.id)}
            className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasChildren && element.isExpanded && (
        <div className="mt-2 space-y-2">
          {element.children!.map((child) => (
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

function DraggableAvailableElement({ element }: { element: AvailableElement }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0">
        {element.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {element.title}
          </span>
          <Badge className={getElementBadgeColor(element.type)}>
            {getElementTypeLabel(element.type)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {element.description}
        </p>
      </div>
      <div className="flex-shrink-0">
        <Plus className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  )
}

function isBuilderElement(el: BuilderElement | AvailableElement): el is BuilderElement {
  return el && typeof el === 'object' && 'order' in el;
}

export default function BuilderPage() {
  const [builderElements, setBuilderElements] = useState<BuilderElement[]>([])
  const [unassignedCourses, setUnassignedCourses] = useState<AvailableElement[]>([])
  const [unassignedLessons, setUnassignedLessons] = useState<AvailableElement[]>([])
  const [unassignedQuizzes, setUnassignedQuizzes] = useState<AvailableElement[]>([])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastReloadTime, setLastReloadTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Add mounted state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)

  // Use ref to store current builder elements for preservation
  const builderElementsRef = useRef<BuilderElement[]>([])

  // Update ref whenever builderElements changes
  useEffect(() => {
    builderElementsRef.current = builderElements
  }, [builderElements])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const loadEntireStructure = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/structure')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json() as StructureResponse

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        const elements = data.elements || []
        if (Array.isArray(elements)) {
          const hierarchicalElements = buildHierarchicalStructure(elements)
          const elementsWithPreservedState = preserveExpansionStates(hierarchicalElements, builderElementsRef.current)
          setBuilderElements(elementsWithPreservedState)
        }
      }
    } catch (error) {
      console.error('Error loading structure:', error)
    }
  }, [])

  const loadAvailableElements = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/available-elements')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json() as AvailableElementsResponse

      if (data && typeof data === 'object') {
        const courses = (data.unassignedCourses || []).map((course: Course) => ({
          ...course,
          type: 'course' as const,
          id: `course-${course.id}`,
          db_id: course.id,
          icon: getElementIcon('course'),
          description: course.description || 'Keine Beschreibung verfügbar'
        }))

        const lessons = (data.unassignedLessons || []).map((lesson: Lesson) => ({
          ...lesson,
          type: 'lesson' as const,
          id: `lesson-${lesson.id}`,
          db_id: lesson.id,
          icon: getElementIcon('lesson'),
          description: lesson.description || 'Keine Beschreibung verfügbar'
        }))

        const quizzes = (data.unassignedQuizzes || []).map((quiz: Quiz) => ({
          ...quiz,
          type: 'quiz' as const,
          id: `quiz-${quiz.id}`,
          db_id: quiz.id,
          icon: getElementIcon('quiz'),
          description: quiz.description || 'Keine Beschreibung verfügbar'
        }))

        setUnassignedCourses(courses)
        setUnassignedLessons(lessons)
        setUnassignedQuizzes(quizzes)

      }
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }, [])

  // Debounced reload function to prevent infinite loops
  const debouncedReload = useCallback(() => {
    const now = Date.now()
    if (now - lastReloadTime > 2000) { // Increase debounce time to 2 seconds
      setLastReloadTime(now)
      void loadEntireStructure()
      void loadAvailableElements()
    }
  }, [lastReloadTime, loadEntireStructure, loadAvailableElements])

  const buildHierarchicalStructure = (flatElements: BuilderElement[]): BuilderElement[] => {
    const elementsMap = new Map<string, BuilderElement>()
    const rootElements: BuilderElement[] = []

    // First pass: create all elements
    flatElements.forEach((element) => {
      elementsMap.set(element.id, {
        ...element,
        children: [],
        isExpanded: element.type === 'module' // Modules should be expanded by default
      })
    })

    // Second pass: build hierarchy
    flatElements.forEach((element) => {
      const currentElement = elementsMap.get(element.id)
      if (!currentElement) return

      if (element.parent_id) {
        const parent = elementsMap.get(element.parent_id)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.push(currentElement)
        }
      } else {
        rootElements.push(currentElement)
      }
    })

    // Sort elements by order
    const sortElements = (elements: BuilderElement[]): BuilderElement[] => {
      return elements.sort((a, b) => a.order - b.order).map(element => ({
        ...element,
        children: element.children ? sortElements(element.children) : []
      }))
    }

    return sortElements(rootElements)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    setIsProcessing(true)

    try {
      // Find the dragged element
      const draggedElement = findElementById([...builderElements, ...unassignedCourses, ...unassignedLessons, ...unassignedQuizzes], active.id as string)
      if (!draggedElement) {
        console.error('Dragged element not found')
        return
      }

      // Find the target element
      const targetElement = findElementById([...builderElements, ...unassignedCourses, ...unassignedLessons, ...unassignedQuizzes], over.id as string)
      if (!targetElement) {
        console.error('Target element not found')
        return
      }

      // Determine the new parent and scope
      let newParentId: string | null = null
      let scope: 'module' | 'course' | 'lesson' = 'module'

      if (isBuilderElement(targetElement)) {
        // Dropping on a builder element
        if (targetElement.type === 'module') {
          newParentId = targetElement.id
          scope = 'module'
        } else if (targetElement.type === 'course') {
          newParentId = targetElement.id
          scope = 'course'
        } else if (targetElement.type === 'lesson') {
          newParentId = targetElement.id
          scope = 'lesson'
        }
      }

      // Determine the element type and ID
      let elementType: 'course' | 'lesson' | 'quiz'
      let elementId: string

      if (draggedElement.type === 'course') {
        elementType = 'course'
        elementId = draggedElement.db_id || draggedElement.id.replace('course-', '')
      } else if (draggedElement.type === 'lesson') {
        elementType = 'lesson'
        elementId = draggedElement.db_id || draggedElement.id.replace('lesson-', '')
      } else if (draggedElement.type === 'quiz') {
        elementType = 'quiz'
        elementId = draggedElement.db_id || draggedElement.id.replace('quiz-', '')
      } else {
        console.error('Invalid element type for assignment')
        return
      }

      // Make the API call to assign the element
      const response = await fetch(`/api/admin/${elementType}s/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementId,
          parentId: newParentId,
          scope
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to assign ${elementType}: ${response.statusText}`)
      }

      // Reload the structure and available elements
      await loadEntireStructure()
      await loadAvailableElements()

    } catch (error) {
      console.error('Error assigning element:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getAllSortableItems = (elements: BuilderElement[]): string[] => {
    const items: string[] = []

    const addItems = (el: BuilderElement) => {
      items.push(el.id)
      if (el.children) {
        el.children.forEach(addItems)
      }
    }

    elements.forEach(addItems)
    return items
  }

  const toggleElementExpansion = (elementId: string) => {
    setBuilderElements(prevElements => {
      const updateElement = (elements: BuilderElement[]): BuilderElement[] => {
        return elements.map(element => {
          if (element.id === elementId) {
            return { ...element, isExpanded: !element.isExpanded }
          }
          if (element.children) {
            return { ...element, children: updateElement(element.children) }
          }
          return element
        })
      }
      return updateElement(prevElements)
    })
  }

  const removeElement = async (elementId: string) => {
    setIsProcessing(true)

    try {
      // Find the element to remove
      const element = findElementById(builderElements, elementId)
      if (!element || !isBuilderElement(element)) {
        console.error('Element not found or not a builder element')
        return
      }

      // Determine the element type and ID
      let elementType: 'course' | 'lesson' | 'quiz'
      let elementDbId: string

      if (element.type === 'course') {
        elementType = 'course'
        elementDbId = element.db_id || element.id.replace('course-', '')
      } else if (element.type === 'lesson') {
        elementType = 'lesson'
        elementDbId = element.db_id || element.id.replace('lesson-', '')
      } else if (element.type === 'quiz') {
        elementType = 'quiz'
        elementDbId = element.db_id || element.id.replace('quiz-', '')
      } else {
        console.error('Invalid element type for removal')
        return
      }

      // Make the API call to unassign the element
      const response = await fetch(`/api/admin/${elementType}s/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elementId: elementDbId
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to unassign ${elementType}: ${response.statusText}`)
      }

      // Remove the element from the local state
      setBuilderElements(prevElements => {
        const removeElementFromTree = (elements: BuilderElement[]): BuilderElement[] => {
          return elements
            .filter(element => element.id !== elementId)
            .map(element => ({
              ...element,
              children: element.children ? removeElementFromTree(element.children) : []
            }))
        }
        return removeElementFromTree(prevElements)
      })

      // Reload available elements to show the unassigned element
      await loadAvailableElements()

    } catch (error) {
      console.error('Error removing element:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const preserveExpansionStates = (newElements: BuilderElement[], currentElements: BuilderElement[]): BuilderElement[] => {
    const updateExpansionStates = (elements: BuilderElement[]): BuilderElement[] => {
      return elements.map(element => {
        const currentElement = findElementById(currentElements, element.id) as BuilderElement | undefined
        const isExpanded = currentElement?.isExpanded ?? (element.type === 'module')

        return {
          ...element,
          isExpanded,
          children: element.children ? updateExpansionStates(element.children) : []
        }
      })
    }

    return updateExpansionStates(newElements)
  }



  // Load data on mount only
  useEffect(() => {
    if (isMounted) {
      void loadEntireStructure()
      void loadAvailableElements()
    }
  }, [isMounted])

  // Use centralized subscription management with longer intervals
  useTableSubscription('courses', '*', undefined, debouncedReload)
  useTableSubscription('lessons', '*', undefined, debouncedReload)
  useTableSubscription('modules', '*', undefined, debouncedReload)
  useTableSubscription('enhanced_quizzes', '*', undefined, debouncedReload)

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  if (isProcessing) {
    return (
      <div className="w-full px-8 py-8" style={{ backgroundColor: '#6d859a' }}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Verarbeite Änderungen...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ backgroundColor: '#6d859a' }}
      className="h-screen p-8"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <SortableContext items={[
            ...getAllSortableItems(builderElements),
            ...unassignedCourses.map(course => course.id),
            ...unassignedLessons.map(lesson => lesson.id),
            ...unassignedQuizzes.map(quiz => quiz.id)
          ]}>
            {/* Left: Builder Structure */}
            <div className="lg:col-span-2 h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto">
              {builderElements.map((element) => (
                <SortableBuilderElement
                  key={element.id}
                  element={element}
                  onRemove={removeElement}
                  onToggle={toggleElementExpansion}
                />
              ))}
            </div>

            {/* Right: Available Elements */}
            <div className="h-full flex flex-col space-y-6">
              {/* Available Courses */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Kurse</h3>
                </div>
                {unassignedCourses.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Keine unzugewiesenen Kurse</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedCourses.map((course) => (
                      <DraggableAvailableElement key={course.id} element={course} />
                    ))}
                  </div>
                )}
              </div>

              {/* Available Lessons */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Lektionen</h3>
                </div>
                {unassignedLessons.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Keine unzugewiesenen Lektionen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedLessons.map((lesson) => (
                      <DraggableAvailableElement key={lesson.id} element={lesson} />
                    ))}
                  </div>
                )}
              </div>

              {/* Available Quizzes */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Quizze</h3>
                </div>
                {unassignedQuizzes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Keine unzugewiesenen Quizze</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unassignedQuizzes.map((quiz) => (
                      <DraggableAvailableElement key={quiz.id} element={quiz} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay - ensures dragged element appears above everything */}
        <DragOverlay>
          {activeId && (() => {
            const allElements = [
              ...builderElements,
              ...unassignedCourses,
              ...unassignedLessons,
              ...unassignedQuizzes
            ]
            const draggingItem = findElementById(allElements, activeId)

            if (!draggingItem) return null

            return (
              <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-xl">
                <div className="flex items-center gap-3">
                  {getElementIcon(draggingItem.type)}
                  <span className="text-base font-medium">{draggingItem.title}</span>
                  <Badge className={getElementBadgeColor(draggingItem.type)}>
                    {getElementTypeLabel(draggingItem.type)}
                  </Badge>
                </div>
              </div>
            )
          })()}
        </DragOverlay>
      </DndContext>
    </div>
  )
}