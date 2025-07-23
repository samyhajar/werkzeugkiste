'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, GripVertical, Plus, Trash2, Edit3, FileText, HelpCircle, BookOpen, FolderOpen } from 'lucide-react'
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
import { getBrowserClient } from '@/lib/supabase/browser-client'

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
    if (element.id === id) return element
    if ('children' in element && element.children && element.children.length > 0) {
      const found = findElementById(element.children, id)
      if (found) return found
    }
  }
  return undefined
}

// Sortable item component for builder elements
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

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: `${level * 20}px` }}
      className={`mb-3 p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 ${
        isDragging ? 'shadow-lg opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between min-h-[60px]">
        <div className="flex items-center gap-4">
          {element.type === 'module' ? (
            <div className="w-5 h-5" />
          ) : (
            <div {...attributes} {...listeners}>
              <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
            </div>
          )}
          <div className="flex items-center gap-3">
            {isBuilderElement(element) && element.isExpanded && element.children && element.children.length > 0 || element.type === 'course' || element.type === 'module' ? (
              <button
                onClick={() => onToggle(element.id)}
                className="text-gray-500 hover:text-gray-700 transition-transform duration-200 ease-in-out"
              >
                <ChevronRight className={`w-5 h-5 transition-transform duration-200 ease-in-out ${
                  'isExpanded' in element && element.isExpanded ? 'rotate-90' : 'rotate-0'
                }`} />
              </button>
            ) : (
              <div className="w-5 h-5" />
            )}
            {getElementIcon(element.type)}
            <span className="font-medium text-base">{element.title}</span>
            <Badge className={getElementBadgeColor(element.type)}>
              {getElementTypeLabel(element.type)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost">
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(element.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {isBuilderElement(element) && element.isExpanded && element.children && element.children.length > 0 && (
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
      className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg z-[9999]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {element.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 truncate">{element.title}</h4>
          {element.description && element.description !== 'Keine Beschreibung verfügbar' && (
            <p className="text-xs text-gray-600 line-clamp-1">{element.description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <Plus className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

function isBuilderElement(el: any): el is BuilderElement {
  return el && typeof el === 'object' && 'order' in el;
}

export default function BuilderPage() {
  const [builderElements, setBuilderElements] = useState<BuilderElement[]>([])
  const [unassignedCourses, setUnassignedCourses] = useState<AvailableElement[]>([])
  const [unassignedLessons, setUnassignedLessons] = useState<AvailableElement[]>([])
  const [unassignedQuizzes, setUnassignedQuizzes] = useState<AvailableElement[]>([])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastReloadTime, setLastReloadTime] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Debounced reload function to prevent infinite loops
  const debouncedReload = useCallback(() => {
    const now = Date.now()
    if (now - lastReloadTime > 1000) { // Only reload if more than 1 second has passed
      setLastReloadTime(now)
      loadEntireStructure()
      loadAvailableElements()
    }
  }, [lastReloadTime])

  useEffect(() => {
    loadEntireStructure()
    loadAvailableElements()

    // Set up real-time subscriptions with debouncing
    const supabase = getBrowserClient()

    // Subscribe to courses table changes
    const coursesSubscription = supabase
      .channel('courses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        console.log('Courses table changed, reloading structure...')
        debouncedReload()
      })
      .subscribe()

    // Subscribe to lessons table changes
    const lessonsSubscription = supabase
      .channel('lessons-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        console.log('Lessons table changed, reloading structure...')
        debouncedReload()
      })
      .subscribe()

    // Subscribe to modules table changes
    const modulesSubscription = supabase
      .channel('modules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        console.log('Modules table changed, reloading structure...')
        debouncedReload()
      })
      .subscribe()

    // Subscribe to enhanced_quizzes table changes
    const quizzesSubscription = supabase
      .channel('enhanced-quizzes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enhanced_quizzes' }, () => {
        console.log('Enhanced quizzes table changed, reloading structure...')
        debouncedReload()
      })
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      coursesSubscription.unsubscribe()
      lessonsSubscription.unsubscribe()
      modulesSubscription.unsubscribe()
      quizzesSubscription.unsubscribe()
    }
  }, [debouncedReload])

  const loadEntireStructure = async () => {
    try {
      const response = await fetch('/api/admin/structure')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        const elements = data.elements || []
        if (Array.isArray(elements)) {
          const hierarchicalElements = buildHierarchicalStructure(elements)
          const elementsWithPreservedState = preserveExpansionStates(hierarchicalElements, builderElements)
          console.log('Loaded structure:', elementsWithPreservedState)
          console.log('Structure details:', elementsWithPreservedState.map(el => ({
            id: el.id,
            type: el.type,
            title: el.title,
            hasChildren: (el.children?.length || 0) > 0,
            isExpanded: isBuilderElement(el) ? el.isExpanded : false,
            childrenCount: el.children?.length || 0
          })))
          setBuilderElements(elementsWithPreservedState)
        }
      }
    } catch (error) {
      console.error('Error loading structure:', error)
    }
  }

  const loadAvailableElements = async () => {
    try {
      const response = await fetch('/api/admin/available-elements')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      if (data && typeof data === 'object') {
        const courses = (data.unassignedCourses || []).map((course: Course) => ({
          ...course,
          type: 'course' as const,
          id: `course-${course.id}`
        }))

        const lessons = (data.unassignedLessons || []).map((lesson: Lesson) => ({
          ...lesson,
          type: 'lesson' as const,
          id: `lesson-${lesson.id}`
        }))

        const quizzes = (data.unassignedQuizzes || []).map((quiz: Quiz) => ({
          ...quiz,
          type: 'quiz' as const,
          id: `quiz-${quiz.id}`
        }))

        setUnassignedCourses(courses)
        setUnassignedLessons(lessons)
        setUnassignedQuizzes(quizzes)
      }
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }

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

    return rootElements
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!active || !over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeElement = findElementById(builderElements, activeId)
    const overElement = findElementById(builderElements, overId)

    if (!activeElement || !overElement) return

    // Check if the active element is a BuilderElement with parent_id
    if (isBuilderElement(activeElement) && activeElement.parent_id) {
      // Handle reassignment logic
      const newParentId = isBuilderElement(overElement) ? overElement.id : activeElement.parent_id

      if (newParentId !== activeElement.parent_id) {
        // Reassign the element
        handleReassignElement(activeElement.id, newParentId)
      }
    }

    // Clear drag states
    setActiveId(null)
  }

  // Helper function to get all sortable items (excluding modules, only nested children)
  const getAllSortableItems = (elements: BuilderElement[]): string[] => {
    const items: string[] = []
    const addItems = (el: BuilderElement) => {
      // Only add non-module elements to sortable items
      if (el.type !== 'module') {
        items.push(el.id)
      }
      if (isBuilderElement(el) && el.children && el.children.length > 0) {
        el.children.forEach(addItems)
      }
    }
    elements.forEach(addItems)
    return items
  }

  const toggleElementExpansion = (elementId: string) => {
    const elementToToggle = findElementById(builderElements, elementId)

    if (!elementToToggle) {
      console.error('Element not found for toggling:', elementId)
      return
    }

    if (!isBuilderElement(elementToToggle)) {
      console.error('Element is not a BuilderElement:', elementId)
      return
    }

    console.log('Toggling element:', elementId, 'Type:', elementToToggle.type, 'Has children:', elementToToggle.children?.length || 0, 'Current expanded:', elementToToggle.isExpanded)

    const updatedElements = builderElements.map(element => {
      if (element.id === elementId && isBuilderElement(element)) {
        return { ...element, isExpanded: !element.isExpanded }
      }
      if (isBuilderElement(element) && element.children && element.children.length > 0) {
        return {
          ...element,
          children: element.children.map(child => {
            if (child.id === elementId && isBuilderElement(child)) {
              return { ...child, isExpanded: !child.isExpanded }
            }
            return child
          })
        }
      }
      return element
    })

    setBuilderElements(updatedElements)
  }

  const removeElement = async (elementId: string) => {
    // Find the element to get its database info
    const elementToRemove = findElementById(builderElements, elementId)

    console.log('Attempting to remove element:', elementId)
    console.log('Found element:', elementToRemove)

    if (!elementToRemove) {
      console.error('Element not found for removal')
      return
    }

    if (!isBuilderElement(elementToRemove) || !elementToRemove.db_type || !elementToRemove.db_id) {
      console.error('Element missing database info:', {
        db_type: elementToRemove.db_type,
        db_id: elementToRemove.db_id,
        element: elementToRemove
      })
      return
    }

    try {
      // Update the element to remove its parent assignment (make it unassigned)
      const response = await fetch(`/api/admin/${elementToRemove.db_type}/unassign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          elementToRemove.db_type === 'courses'
            ? { course_id: elementToRemove.db_id }
            : elementToRemove.db_type === 'lessons'
            ? { lesson_id: elementToRemove.db_id }
            : { quiz_id: elementToRemove.db_id }
        ),
      })

      if (response.ok) {
        // Remove from builder structure
        const removeElementFromTree = (elements: BuilderElement[]): BuilderElement[] => {
          return elements
            .filter(element => element.id !== elementId)
            .map(element => ({
              ...element,
              children: isBuilderElement(element) && element.children ? removeElementFromTree(element.children) : []
            }))
        }

        setBuilderElements(prev => removeElementFromTree(prev))

        // Add back to appropriate available list (only for courses, lessons, quizzes)
        if (isBuilderElement(elementToRemove) && (elementToRemove.type === 'course' || elementToRemove.type === 'lesson' || elementToRemove.type === 'quiz')) {
          const availableElement: AvailableElement = {
            id: `${elementToRemove.type}-${elementToRemove.db_id}`,
            type: elementToRemove.type,
            title: elementToRemove.title,
            description: elementToRemove.description || '',
            icon: getElementIcon(elementToRemove.type),
            db_id: elementToRemove.db_id,
            db_type: elementToRemove.db_type
          }

          if (elementToRemove.type === 'course') {
            setUnassignedCourses(prev => [...prev, availableElement])
          } else if (elementToRemove.type === 'lesson') {
            setUnassignedLessons(prev => [...prev, availableElement])
          } else if (elementToRemove.type === 'quiz') {
            setUnassignedQuizzes(prev => [...prev, availableElement])
          }
        }

        console.log('Element moved to available list successfully')
      } else {
        const errorData = await response.json()
        console.error('Error unassigning element:', errorData.error)
      }
    } catch (error) {
      console.error('Error unassigning element:', error)
    }
  }

  // Add the missing preserveExpansionStates function
  const preserveExpansionStates = (newElements: BuilderElement[], currentElements: BuilderElement[]): BuilderElement[] => {
    return newElements.map(newElement => {
      const currentElement = findElementById(currentElements, newElement.id)
      return {
        ...newElement,
        isExpanded: isBuilderElement(currentElement) ? currentElement.isExpanded : false,
        children: newElement.children ? preserveExpansionStates(newElement.children, currentElements) : []
      }
    })
  }

  // Add the missing handleReassignElement function
  const handleReassignElement = async (elementId: string, newParentId: string) => {
    try {
      const element = findElementById(builderElements, elementId)
      if (!element || !isBuilderElement(element)) return

      // Handle reassignment based on element type
      if (element.type === 'course') {
        const response = await fetch('/api/admin/courses/assign', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: element.db_id,
            module_id: newParentId
          }),
        })

        if (!response.ok) {
          console.error('Failed to reassign course')
        }
      } else if (element.type === 'lesson') {
        const response = await fetch('/api/admin/lessons/assign', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson_id: element.db_id,
            course_id: newParentId
          }),
        })

        if (!response.ok) {
          console.error('Failed to reassign lesson')
        }
      } else if (element.type === 'quiz') {
        const response = await fetch('/api/admin/quizzes/assign', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: element.db_id,
            course_id: newParentId
          }),
        })

        if (!response.ok) {
          console.error('Failed to reassign quiz')
        }
      }
    } catch (error) {
      console.error('Error reassigning element:', error)
    }
  }

  if (builderElements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Struktur...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ backgroundColor: '#6d859a' }}
      className="min-h-screen p-4 lg:p-8"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 h-full min-h-[calc(100vh-2rem)]">
          <SortableContext items={[
            ...getAllSortableItems(builderElements),
            ...unassignedCourses.map(course => course.id),
            ...unassignedLessons.map(lesson => lesson.id),
            ...unassignedQuizzes.map(quiz => quiz.id)
          ]}>
            {/* Left: Builder Structure */}
            <div className="lg:col-span-2 h-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 overflow-y-auto">
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
            <div className="h-full flex flex-col space-y-4 max-h-full">
              {/* Available Courses */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-shrink-0" style={{ height: 'calc(33vh - 1rem)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <FolderOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Kurse</h3>
                </div>
                <div className="h-full overflow-y-auto">
                  {unassignedCourses.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Keine unzugewiesenen Kurse</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassignedCourses.map((course: AvailableElement) => (
                        <DraggableAvailableElement key={course.id} element={course} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Lessons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-shrink-0" style={{ height: 'calc(33vh - 1rem)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Lektionen</h3>
                </div>
                <div className="h-full overflow-y-auto">
                  {unassignedLessons.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Keine unzugewiesenen Lektionen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassignedLessons.map((lesson: AvailableElement) => (
                        <DraggableAvailableElement key={lesson.id} element={lesson} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Quizzes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-shrink-0" style={{ height: 'calc(33vh - 1rem)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Verfügbare Quizze</h3>
                </div>
                <div className="h-full overflow-y-auto">
                  {unassignedQuizzes.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Keine unzugewiesenen Quizze</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unassignedQuizzes.map((quiz: AvailableElement) => (
                        <DraggableAvailableElement key={quiz.id} element={quiz} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay - ensures dragged element appears above everything */}
        <DragOverlay>
          {activeId && (() => {
            const allElements: (BuilderElement | AvailableElement)[] = [
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