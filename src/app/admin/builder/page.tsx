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
  DragOverEvent,
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

// Sortable item component for builder elements
function SortableBuilderElement({ element, onRemove, onToggle, level = 0, isOver = false, hoverPosition = null, overId = null }: {
  element: BuilderElement
  onRemove: (id: string) => Promise<void>
  onToggle: (id: string) => void
  level?: number
  isOver?: boolean
  hoverPosition?: 'before' | 'after' | null
  overId?: string | null
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
      default:
        return <FileText className="w-4 h-4" />
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
        return 'bg-purple-100 text-purple-800'
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

  const getDraggedElementStyle = (type: string, isDragging: boolean) => {
    if (!isDragging) return ''

    switch (type) {
      case 'module':
        return 'shadow-orange-500/50 bg-orange-50 border-orange-300'
      case 'course':
        return 'shadow-purple-500/50 bg-purple-50 border-purple-300'
      case 'lesson':
        return 'shadow-green-500/50 bg-green-50 border-green-300'
      case 'quiz':
        return 'shadow-blue-500/50 bg-blue-50 border-blue-300'
      default:
        return 'shadow-gray-500/50 bg-gray-50 border-gray-300'
    }
  }

  return (
    <div
      ref={element.type === 'module' ? undefined : setNodeRef}
      style={element.type === 'module' ? { marginLeft: `${level * 20}px` } : { ...style, marginLeft: `${level * 20}px` }}
      className={`relative mb-3 p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 ${
        element.type === 'module' ? '' : (isDragging ? `shadow-lg opacity-50 ${getDraggedElementStyle(element.type, isDragging)}` : '')
      } ${isOver ? 'border-blue-500 bg-blue-100 shadow-lg scale-105' : ''}`}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none" />
      )}

      {/* Spread effect indicators */}
      {hoverPosition === 'before' && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-400 rounded-full opacity-75" />
      )}
      {hoverPosition === 'after' && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-400 rounded-full opacity-75" />
      )}
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
            {(element.children && element.children.length > 0) || element.type === 'course' ? (
              <button
                onClick={() => onToggle(element.id)}
                className="text-gray-500 hover:text-gray-700 transition-transform duration-200 ease-in-out"
              >
                <ChevronRight className={`w-5 h-5 transition-transform duration-200 ease-in-out ${
                  element.isExpanded ? 'rotate-90' : 'rotate-0'
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
      {element.isExpanded && element.children && element.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {element.children.map((child) => (
            <SortableBuilderElement
              key={child.id}
              element={child}
              onRemove={onRemove}
              onToggle={onToggle}
              level={level + 1}
              isOver={overId === child.id}
              hoverPosition={overId === child.id ? hoverPosition : null}
              overId={overId}
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
      className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move min-h-[80px] ${
        isDragging ? 'shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4 h-full">
        <div className="flex-shrink-0">
          {element.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-base mb-1">{element.title}</h4>
          <p className="text-sm text-gray-600">{element.description}</p>
        </div>
        <div className="flex-shrink-0">
          <Plus className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

export default function BuilderPage() {
  const [builderElements, setBuilderElements] = useState<BuilderElement[]>([])
  const [unassignedCourses, setUnassignedCourses] = useState<AvailableElement[]>([])
  const [unassignedLessons, setUnassignedLessons] = useState<AvailableElement[]>([])
  const [unassignedQuizzes, setUnassignedQuizzes] = useState<AvailableElement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [hoverPosition, setHoverPosition] = useState<'before' | 'after' | null>(null)

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
    }
  ]

      useEffect(() => {
      loadEntireStructure()
      loadAvailableElements()

      // Set up real-time subscriptions
      const supabase = getBrowserClient()

      // Subscribe to courses table changes
      const coursesSubscription = supabase
        .channel('courses-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
          console.log('Courses table changed, reloading structure...')
          loadEntireStructure()
          loadAvailableElements()
        })
        .subscribe()

      // Subscribe to lessons table changes
      const lessonsSubscription = supabase
        .channel('lessons-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
          console.log('Lessons table changed, reloading structure...')
          loadEntireStructure()
          loadAvailableElements()
        })
        .subscribe()

      // Subscribe to modules table changes
      const modulesSubscription = supabase
        .channel('modules-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
          console.log('Modules table changed, reloading structure...')
          loadEntireStructure()
          loadAvailableElements()
        })
        .subscribe()

      // Subscribe to quizzes table changes
      const quizzesSubscription = supabase
        .channel('quizzes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
          console.log('Quizzes table changed, reloading structure...')
          loadEntireStructure()
          loadAvailableElements()
        })
        .subscribe()

      // Cleanup subscriptions on unmount
      return () => {
        coursesSubscription.unsubscribe()
        lessonsSubscription.unsubscribe()
        modulesSubscription.unsubscribe()
        quizzesSubscription.unsubscribe()
      }
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

  const loadAvailableElements = async () => {
    try {
      const response = await fetch('/api/admin/available-elements', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Transform unassigned courses
          const courses = (data.unassignedCourses || []).map((course: any) => ({
            id: `course-${course.id}`,
            type: 'course' as const,
            title: course.title,
            description: course.description || '',
            icon: <Folder className="w-4 h-4" />,
            db_id: course.id,
            db_type: 'courses'
          }))

          // Transform unassigned lessons
          const lessons = (data.unassignedLessons || []).map((lesson: any) => ({
            id: `lesson-${lesson.id}`,
            type: 'lesson' as const,
            title: lesson.title,
            description: lesson.content || lesson.markdown || '',
            icon: <FileText className="w-4 h-4" />,
            db_id: lesson.id,
            db_type: 'lessons'
          }))

          // Transform unassigned quizzes
          const quizzes = (data.unassignedQuizzes || []).map((quiz: any) => ({
            id: `quiz-${quiz.id}`,
            type: 'quiz' as const,
            title: quiz.title,
            description: quiz.description || '',
            icon: <HelpCircle className="w-4 h-4" />,
            db_id: quiz.id,
            db_type: 'quizzes'
          }))

          setUnassignedCourses(courses)
          setUnassignedLessons(lessons)
          setUnassignedQuizzes(quizzes)
        }
      }
    } catch (error) {
      console.error('Error loading available elements:', error)
    }
  }

  const buildHierarchicalStructure = (flatElements: any[]): BuilderElement[] => {
    const elementsMap = new Map()
    const rootElements: BuilderElement[] = []

    // First pass: create all elements
    flatElements.forEach((element) => {
      elementsMap.set(element.id, {
        ...element,
        children: [],
        isExpanded: false // Set default to collapsed state
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    // Prevent dragging of modules
    const activeElementInBuilder = findElementById(builderElements, active.id as string)
    if (activeElementInBuilder && activeElementInBuilder.type === 'module') {
      setOverId(null)
      setHoverPosition(null)
      return
    }

    // Check if we're dragging from available elements
    const allAvailableElements = [...unassignedCourses, ...unassignedLessons, ...unassignedQuizzes]
    const activeElement = allAvailableElements.find((el: any) => el.id === active.id)

    if (activeElement) {
      // Find the most specific target element (deepest in the tree)
      const targetElement = findElementById(builderElements, over?.id as string)

      // For lessons, we want to target the specific lesson, not the course
      if (activeElement.type === 'lesson') {
        // If hovering over a lesson, target the lesson itself for reordering
        if (targetElement?.type === 'lesson') {
          setOverId(over?.id as string || null)
        } else if (targetElement?.type === 'course') {
          // If hovering over a course, allow adding to course
          setOverId(over?.id as string || null)
        } else {
          setOverId(null)
        }
      } else if (activeElement.type === 'course') {
        // If hovering over a course, target the course itself for reordering
        if (targetElement?.type === 'course') {
          setOverId(over?.id as string || null)
        } else if (targetElement?.type === 'module') {
          // If hovering over a module, allow adding to module
          setOverId(over?.id as string || null)
        } else {
          setOverId(null)
        }
      } else if (activeElement.type === 'quiz') {
        // For quizzes, target courses
        if (targetElement?.type === 'course') {
          setOverId(over?.id as string || null)
        } else {
          setOverId(null)
        }
      } else {
        setOverId(null)
      }
    } else {
      // For reordering within builder, always show indicator
      setOverId(over?.id as string || null)
    }

    // Set hover position for spread effect
    if (over?.id) {
      const rect = (over as any).rect
      if (rect) {
        const centerY = rect.top + rect.height / 2
        const mouseY = (event.activatorEvent as MouseEvent)?.clientY || 0

        // Determine if we're hovering above or below the center
        if (mouseY < centerY) {
          setHoverPosition('before')
        } else {
          setHoverPosition('after')
        }
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Prevent dragging of modules
    const activeElementInBuilder = findElementById(builderElements, active.id as string)
    if (activeElementInBuilder && activeElementInBuilder.type === 'module') {
      setActiveId(null)
      setOverId(null)
      setHoverPosition(null)
      return
    }

    if (active.id !== over?.id) {
      // Check if we're moving from available to builder
      const allAvailableElements = [...unassignedCourses, ...unassignedLessons, ...unassignedQuizzes]
      const activeElement = allAvailableElements.find((el: any) => el.id === active.id)
      if (activeElement) {
        // Find the target element to determine where to add
        const targetElement = findElementById(builderElements, over?.id as string)

        if (activeElement.type === 'course') {
          if (targetElement && targetElement.type === 'module') {
            // Assign course to module in database
            try {
              const response = await fetch(`/api/admin/courses/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  course_id: activeElement.db_id,
                  module_id: targetElement.db_id
                }),
              })

              if (response.ok) {
                const newElement: BuilderElement = {
                  id: `${activeElement.type}-${Date.now()}`,
                  type: activeElement.type,
                  title: activeElement.title,
                  description: activeElement.description,
                  order: targetElement.children?.length || 0,
                  parent_id: targetElement.id,
                  children: [],
                  db_id: activeElement.db_id,
                  db_type: activeElement.db_type
                }

                // Add to the module's children at the correct position
                setBuilderElements(prev =>
                  prev.map(element =>
                    element.id === targetElement.id
                      ? {
                          ...element,
                          children: hoverPosition === 'before'
                            ? [newElement, ...(element.children || [])]
                            : [...(element.children || []), newElement]
                        }
                      : element
                  )
                )

                // Remove from unassigned courses
                setUnassignedCourses(prev => prev.filter(course => course.id !== activeElement.id))
              } else {
                console.error('Failed to assign course to module')
              }
            } catch (error) {
              console.error('Error assigning course to module:', error)
            }
          }
        } else if (activeElement.type === 'lesson' || activeElement.type === 'quiz') {
          // Lessons and quizzes can be added to courses
          if (targetElement && targetElement.type === 'course') {
            try {
              const response = await fetch(`/api/admin/${activeElement.db_type}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(
                  activeElement.db_type === 'lessons'
                    ? { lesson_id: activeElement.db_id, course_id: targetElement.db_id }
                    : { quiz_id: activeElement.db_id, course_id: targetElement.db_id }
                ),
              })

              if (response.ok) {
                const newElement: BuilderElement = {
                  id: `${activeElement.type}-${Date.now()}`,
                  type: activeElement.type,
                  title: activeElement.title,
                  description: activeElement.description,
                  order: targetElement.children?.length || 0,
                  parent_id: targetElement.id,
                  children: [],
                  db_id: activeElement.db_id,
                  db_type: activeElement.db_type
                }

                // Add to the course's children at the correct position
                setBuilderElements(prev =>
                  prev.map(module =>
                    module.id === targetElement.parent_id
                      ? {
                          ...module,
                          children: module.children?.map(course =>
                            course.id === targetElement.id
                              ? {
                                  ...course,
                                  children: hoverPosition === 'before'
                                    ? [newElement, ...(course.children || [])]
                                    : [...(course.children || []), newElement]
                                }
                              : course
                          ) || []
                        }
                      : module
                  )
                )

                // Remove from appropriate unassigned list
                if (activeElement.type === 'lesson') {
                  setUnassignedLessons(prev => prev.filter(lesson => lesson.id !== activeElement.id))
                } else if (activeElement.type === 'quiz') {
                  setUnassignedQuizzes(prev => prev.filter(quiz => quiz.id !== activeElement.id))
                }
              } else {
                console.error('Failed to assign element to course')
              }
            } catch (error) {
              console.error('Error assigning element to course:', error)
            }
          }
        }
      } else {
        // Reordering within builder - handle both top-level and nested elements
        const activeElementInBuilder = findElementById(builderElements, active.id as string)
        const targetElementInBuilder = findElementById(builderElements, over?.id as string)

        if (activeElementInBuilder && targetElementInBuilder) {
          // Both elements are in the builder structure
          if (activeElementInBuilder.type === 'course' && targetElementInBuilder.type === 'course') {
            // Reordering courses within the same module
            const parentModule = findElementById(builderElements, activeElementInBuilder.parent_id!)
            if (parentModule && activeElementInBuilder.parent_id === targetElementInBuilder.parent_id) {
              const oldIndex = parentModule.children?.findIndex(course => course.id === activeElementInBuilder.id) || 0
              const newIndex = parentModule.children?.findIndex(course => course.id === targetElementInBuilder.id) || 0

              setBuilderElements(prev =>
                prev.map(module =>
                  module.id === parentModule.id
                    ? {
                        ...module,
                        children: arrayMove(
                          module.children || [],
                          oldIndex,
                          hoverPosition === 'before' ? newIndex : newIndex + 1
                        )
                      }
                    : module
                )
              )
              // Save the new order to database
              await saveStructureOrder(builderElements)
            }
          } else if (activeElementInBuilder.type === 'lesson' && targetElementInBuilder.type === 'lesson') {
            // Reordering lessons within the same course
            const parentCourse = findElementById(builderElements, activeElementInBuilder.parent_id!)
            if (parentCourse && activeElementInBuilder.parent_id === targetElementInBuilder.parent_id) {
              const oldIndex = parentCourse.children?.findIndex(lesson => lesson.id === activeElementInBuilder.id) || 0
              const newIndex = parentCourse.children?.findIndex(lesson => lesson.id === targetElementInBuilder.id) || 0

              setBuilderElements(prev =>
                prev.map(module =>
                  module.id === parentCourse.parent_id
                    ? {
                        ...module,
                        children: module.children?.map(course =>
                          course.id === parentCourse.id
                            ? {
                                ...course,
                                children: arrayMove(
                                  course.children || [],
                                  oldIndex,
                                  hoverPosition === 'before' ? newIndex : newIndex + 1
                                )
                              }
                            : course
                        ) || []
                      }
                    : module
                )
              )
              // Save the new order to database
              await saveStructureOrder(builderElements)
            }
          } else if (activeElementInBuilder.type === 'quiz' && targetElementInBuilder.type === 'quiz') {
            // Reordering quizzes within the same course
            const parentCourse = findElementById(builderElements, activeElementInBuilder.parent_id!)
            if (parentCourse && activeElementInBuilder.parent_id === targetElementInBuilder.parent_id) {
              const oldIndex = parentCourse.children?.findIndex(quiz => quiz.id === activeElementInBuilder.id) || 0
              const newIndex = parentCourse.children?.findIndex(quiz => quiz.id === targetElementInBuilder.id) || 0

              setBuilderElements(prev =>
                prev.map(module =>
                  module.id === parentCourse.parent_id
                    ? {
                        ...module,
                        children: module.children?.map(course =>
                          course.id === parentCourse.id
                            ? {
                                ...course,
                                children: arrayMove(
                                  course.children || [],
                                  oldIndex,
                                  hoverPosition === 'before' ? newIndex : newIndex + 1
                                )
                              }
                            : course
                        ) || []
                      }
                    : module
                )
              )
              // Save the new order to database
              await saveStructureOrder(builderElements)
            }
          } else {
            // Reordering top-level elements (modules)
            setBuilderElements((items) => {
              const oldIndex = items.findIndex(item => item.id === active.id)
              const newIndex = items.findIndex(item => item.id === over?.id)

              const reorderedItems = arrayMove(
                items,
                oldIndex,
                hoverPosition === 'before' ? newIndex : newIndex + 1
              ).map((element, index) => ({
                ...element,
                order: index
              }))

              // Save the new order immediately
              saveStructureOrder(reorderedItems)

              return reorderedItems
            })
          }
        }
      }
    }

    setActiveId(null)
    setOverId(null)
    setHoverPosition(null)
  }

  // Helper function to get all sortable items (excluding modules, only nested children)
  const getAllSortableItems = (elements: BuilderElement[]): string[] => {
    const items: string[] = []
    const addItems = (el: BuilderElement) => {
      // Only add non-module elements to sortable items
      if (el.type !== 'module') {
        items.push(el.id)
      }
      if (el.children) {
        el.children.forEach(addItems)
      }
    }
    elements.forEach(addItems)
    return items
  }

  // Helper function to find element by ID in the tree
  const findElementById = (elements: BuilderElement[], id: string): BuilderElement | null => {
    for (const element of elements) {
      if (element.id === id) {
        return element
      }
      if (element.children) {
        const found = findElementById(element.children, id)
        if (found) return found
      }
    }
    return null
  }

  const toggleElementExpansion = (elementId: string) => {
    // First, find the element being toggled to determine its type
    const elementToToggle = findElementById(builderElements, elementId)

    if (!elementToToggle) {
      console.error('Element not found for toggling:', elementId)
      return
    }

    console.log('Toggling element:', elementId, 'Type:', elementToToggle.type, 'Has children:', elementToToggle.children?.length || 0)

    const updateElementExpansion = (elements: BuilderElement[]): BuilderElement[] => {
      return elements.map(element => {
        // Check if this is the element we want to toggle
        if (element.id === elementId) {
          console.log('Found element to toggle:', element.title, 'Type:', element.type, 'Current state:', element.isExpanded)
          return { ...element, isExpanded: !element.isExpanded }
        }

        // If this is a module and we're toggling a module, apply accordion behavior
        if (element.type === 'module' && elementToToggle.type === 'module') {
          // Close all other modules when one is opened
          return { ...element, isExpanded: false }
        }

        // Recursively update children if they exist
        if (element.children && element.children.length > 0) {
          return {
            ...element,
            children: updateElementExpansion(element.children)
          }
        }

        // Return unchanged element
        return element
      })
    }

    setBuilderElements(prev => updateElementExpansion(prev))
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

    if (!elementToRemove.db_type || !elementToRemove.db_id) {
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
              children: element.children ? removeElementFromTree(element.children) : []
            }))
        }

        setBuilderElements(prev => removeElementFromTree(prev))

        // Add back to appropriate available list (only for courses, lessons, quizzes)
        if (elementToRemove.type === 'course' || elementToRemove.type === 'lesson' || elementToRemove.type === 'quiz') {
          const availableElement: AvailableElement = {
            id: `${elementToRemove.type}-${elementToRemove.db_id}`,
            type: elementToRemove.type as 'course' | 'lesson' | 'quiz',
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

  // Helper function to get element icon
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <Folder className="w-4 h-4" />
      case 'lesson':
        return <FileText className="w-4 h-4" />
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const saveStructureOrder = async (elements: BuilderElement[]) => {
    try {
      const response = await fetch('/api/admin/structure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ elements }),
      })

      if (response.ok) {
        console.log('Order updated successfully')
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
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
      <div className="w-full px-8 py-8" style={{ backgroundColor: '#6d859a' }}>
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
    <div
      style={{ backgroundColor: '#6d859a' }}
      className="h-screen p-8"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left: Builder Structure */}
          <div className="lg:col-span-2 h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-y-auto">
            <SortableContext items={getAllSortableItems(builderElements)}>
              {builderElements.map((element) => (
                <SortableBuilderElement
                  key={element.id}
                  element={element}
                  onRemove={removeElement}
                  onToggle={toggleElementExpansion}
                  isOver={overId === element.id}
                  hoverPosition={overId === element.id ? hoverPosition : null}
                  overId={overId}
                />
              ))}
            </SortableContext>
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
        </div>
      </DndContext>
    </div>
  )
}