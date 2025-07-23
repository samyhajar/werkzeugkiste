'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Edit3, FileText, HelpCircle, BookOpen, FolderOpen, Folder } from 'lucide-react'
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

const findElementById = (elements: BuilderElement[], id: string): BuilderElement | undefined => {
  for (const element of elements) {
    if (element.id === id) {
      return element
    }
    if (element.children) {
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
            {(element.children && element.children.length > 0) || element.type === 'course' || element.type === 'module' ? (
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
        isDragging ? 'shadow-lg z-[9999]' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4 h-full">
        <div className="flex-shrink-0">
          {element.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-base mb-1">{element.title}</h4>
          {element.description && element.description !== 'Keine Beschreibung verfügbar' && (
            <p className="text-sm text-gray-600 line-clamp-2">{element.description}</p>
          )}
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

  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastReloadTime, setLastReloadTime] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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

    // Subscribe to quizzes table changes
    const quizzesSubscription = supabase
      .channel('quizzes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
        console.log('Quizzes table changed, reloading structure...')
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
      const response = await fetch('/api/admin/structure', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Transform the flat structure into hierarchical structure
          const hierarchicalElements = buildHierarchicalStructure(data.elements)

          // Preserve expansion states from current state
          const preserveExpansionStates = (newElements: BuilderElement[], currentElements: BuilderElement[]): BuilderElement[] => {
            return newElements.map(newElement => {
              const currentElement = findElementById(currentElements, newElement.id)
              return {
                ...newElement,
                isExpanded: currentElement ? currentElement.isExpanded : false, // Only preserve if element exists in current state
                children: newElement.children ? preserveExpansionStates(newElement.children, currentElements) : []
              }
            })
          }

          const elementsWithPreservedState = preserveExpansionStates(hierarchicalElements, builderElements)
          console.log('Loaded structure:', elementsWithPreservedState)
          console.log('Structure details:', elementsWithPreservedState.map(el => ({
            id: el.id,
            type: el.type,
            title: el.title,
            hasChildren: (el.children?.length || 0) > 0,
            isExpanded: el.isExpanded,
            childrenCount: el.children?.length || 0
          })))
          setBuilderElements(elementsWithPreservedState)
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
            description: course.description || 'Keine Beschreibung verfügbar',
            icon: <Folder className="w-4 h-4" />,
            db_id: course.id,
            db_type: 'courses'
          }))

          // Transform unassigned lessons
          const lessons = (data.unassignedLessons || []).map((lesson: any) => ({
            id: `lesson-${lesson.id}`,
            type: 'lesson' as const,
            title: lesson.title,
            description: lesson.description || 'Keine Beschreibung verfügbar',
            icon: <FileText className="w-4 h-4" />,
            db_id: lesson.id,
            db_type: 'lessons'
          }))

          // Transform unassigned quizzes
          const quizzes = (data.unassignedQuizzes || []).map((quiz: any) => ({
            id: `quiz-${quiz.id}`,
            type: 'quiz' as const,
            title: quiz.title,
            description: quiz.description || 'Keine Beschreibung verfügbar',
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
    console.log('🔍 Building hierarchical structure from:', flatElements.length, 'flat elements')

    const elementsMap = new Map()
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

      if (element.parent_id) {
        const parent = elementsMap.get(element.parent_id)
        if (parent) {
          parent.children.push(currentElement)
          console.log(`🔍 Added ${currentElement.type} "${currentElement.title}" to parent ${parent.type} "${parent.title}"`)
        } else {
          console.log(`🔍 Warning: Parent ${element.parent_id} not found for ${element.type} "${element.title}"`)
        }
      } else {
        rootElements.push(currentElement)
        console.log(`🔍 Added root element: ${currentElement.type} "${currentElement.title}"`)
      }
    })

    console.log('🔍 Final hierarchy:', rootElements.map(el => ({
      id: el.id,
      type: el.type,
      title: el.title,
      childrenCount: el.children?.length || 0,
      isExpanded: el.isExpanded
    })))

    return rootElements
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

              // Prevent dragging of modules
    const activeElementInBuilder = findElementById(builderElements, active.id as string)
    if (activeElementInBuilder && activeElementInBuilder.type === 'module') {
      setActiveId(null)
      return
    }

        // Check if we're moving from available to builder
    const allAvailableElements = [...unassignedCourses, ...unassignedLessons, ...unassignedQuizzes]
    const activeElement = allAvailableElements.find((el: any) => el.id === active.id)

    console.log('🔍 Drag End Debug:', {
      activeId: active.id,
      overId: over?.id,
      activeElement: active,
      overElement: over,
      activeType: activeElement?.type,
      overType: findElementById(builderElements, over?.id as string)?.type,
      overElementTitle: findElementById(builderElements, over?.id as string)?.title,
      isFromAvailable: !!activeElement
    })

    console.log('🔍 Available Element Found:', activeElement)

    if (activeElement && over) {
      // Find the target element to determine where to add
      let targetElement = findElementById(builderElements, over?.id as string)

      // If we're dragging over a child element, find its parent course
      if (targetElement && activeElement.type === 'lesson' && targetElement.type === 'lesson') {
        // Find the parent course of this lesson
        const findParentCourse = (elements: BuilderElement[]): BuilderElement | undefined => {
          for (const element of elements) {
            if (element.children) {
              const hasLesson = element.children.some(child => child.id === targetElement?.id)
              if (hasLesson) {
                return element
              }
              const found = findParentCourse(element.children)
              if (found) return found
            }
          }
          return undefined
        }

        const parentCourse = findParentCourse(builderElements)
        if (parentCourse) {
          targetElement = parentCourse
          console.log('🔍 Found parent course for lesson:', parentCourse.title)
        }
      }

            // If we're dragging over a child element, find its parent module
      if (targetElement && activeElement.type === 'course' && targetElement.type === 'course') {
        // Find the parent module of this course
        const findParentModule = (elements: BuilderElement[]): BuilderElement | undefined => {
          for (const element of elements) {
            if (element.children) {
              const hasCourse = element.children.some(child => child.id === targetElement?.id)
              if (hasCourse) {
                return element
              }
              const found = findParentModule(element.children)
              if (found) return found
            }
          }
          return undefined
        }

        const parentModule = findParentModule(builderElements)
        if (parentModule) {
          targetElement = parentModule
          console.log('🔍 Found parent module for course:', parentModule.title)
        } else {
          console.log('❌ Could not find parent module for course:', targetElement.title)
        }
      }

      // Also check if we're dragging over a module directly
      if (targetElement && activeElement.type === 'course' && targetElement.type === 'module') {
        console.log('✅ Dragging course directly over module:', targetElement.title)
      }

      console.log('🔍 Target Element Found:', targetElement)

      if (activeElement.type === 'course') {
        if (targetElement && targetElement.type === 'module') {
          console.log('🔍 Assigning course to module:', {
            courseId: activeElement.db_id,
            moduleId: targetElement.db_id
          })

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

            console.log('🔍 API Response Status:', response.status)

            if (response.ok) {
              const newElement: BuilderElement = {
                id: `${activeElement.type}-${activeElement.db_id}`,
                type: activeElement.type,
                title: activeElement.title,
                description: activeElement.description,
                order: targetElement.children?.length || 0,
                parent_id: targetElement.id,
                children: [],
                db_id: activeElement.db_id,
                db_type: activeElement.db_type
              }

              console.log('🔍 New Element Created:', newElement)

              // Add to the module's children
              setBuilderElements(prev =>
                prev.map(element =>
                  element.id === targetElement.id
                    ? {
                        ...element,
                        children: [...(element.children || []), newElement],
                        isExpanded: true // Force module to stay expanded when adding courses
                      }
                    : element
                )
              )

              // Remove from unassigned courses
              setUnassignedCourses(prev => prev.filter(course => course.id !== activeElement.id))

              console.log('✅ Course successfully assigned to module')
              console.log('🔍 Course expansion state preserved:', targetElement.isExpanded)
            } else {
              const errorData = await response.json()
              console.error('❌ Failed to assign course to module:', errorData)
            }
          } catch (error) {
            console.error('❌ Error assigning course to module:', error)
          }
        } else {
          console.log('❌ Invalid target for course:', targetElement?.type)
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
                id: `${activeElement.type}-${activeElement.db_id}`,
                type: activeElement.type,
                title: activeElement.title,
                description: activeElement.description,
                order: targetElement.children?.length || 0,
                parent_id: targetElement.id,
                children: [],
                db_id: activeElement.db_id,
                db_type: activeElement.db_type
              }

              // Add to the course's children
              setBuilderElements(prev =>
                prev.map(module =>
                  module.id === targetElement.parent_id
                    ? {
                        ...module,
                        children: module.children?.map(course =>
                          course.id === targetElement.id
                            ? {
                                ...course,
                                children: [...(course.children || []), newElement],
                                isExpanded: course.isExpanded // Preserve expansion state
                              }
                            : course
                        ) || []
                      }
                    : module
                )
              )

              // Remove from unassigned lists
              if (activeElement.type === 'lesson') {
                setUnassignedLessons(prev => prev.filter(lesson => lesson.id !== activeElement.id))
              } else {
                setUnassignedQuizzes(prev => prev.filter(quiz => quiz.id !== activeElement.id))
              }

              console.log('✅ Lesson/Quiz successfully assigned to course')
              console.log('🔍 Course expansion state preserved:', targetElement.isExpanded)
            } else {
              console.error('Failed to assign lesson/quiz to course')
            }
          } catch (error) {
            console.error('Error assigning lesson/quiz to course:', error)
          }
        }
      }
    } else {
      // Handle reordering within the same parent
      const activeElementInBuilder = findElementById(builderElements, active.id as string)
      const overElementInBuilder = findElementById(builderElements, over?.id as string)

      console.log('🔍 Reorder Check:', {
        activeElementInBuilder: activeElementInBuilder?.title,
        overElementInBuilder: overElementInBuilder?.title,
        activeElementInBuilderType: activeElementInBuilder?.type,
        overElementInBuilderType: overElementInBuilder?.type,
        activeId: active.id,
        overId: over?.id
      })

      if (activeElementInBuilder && overElementInBuilder && active.id !== over?.id) {
        console.log('🔍 Reordering elements:', {
          active: activeElementInBuilder.title,
          over: overElementInBuilder.title,
          activeParent: activeElementInBuilder.parent_id,
          overParent: overElementInBuilder.parent_id
        })

        // Only reorder if they have the same parent
        if (activeElementInBuilder.parent_id === overElementInBuilder.parent_id) {
          console.log('✅ Same parent, allowing reorder')

          // Find the parent element
          const findParentElement = (elements: BuilderElement[], parentId: string): BuilderElement | undefined => {
            for (const element of elements) {
              if (element.id === parentId) {
                return element
              }
              if (element.children) {
                const found = findParentElement(element.children, parentId)
                if (found) return found
              }
            }
            return undefined
          }

          const parentElement = findParentElement(builderElements, activeElementInBuilder.parent_id!)
          if (parentElement && parentElement.children) {
            const oldIndex = parentElement.children.findIndex(child => child.id === active.id)
            const newIndex = parentElement.children.findIndex(child => child.id === over?.id)

            if (oldIndex !== -1 && newIndex !== -1) {
              console.log('🔍 Reordering from index', oldIndex, 'to', newIndex)

              // Reorder the children
              const reorderedChildren = arrayMove(parentElement.children, oldIndex, newIndex)

              // Update the parent's children in UI
              setBuilderElements(prev => {
                const updateElement = (elements: BuilderElement[]): BuilderElement[] => {
                  return elements.map(element => {
                    if (element.id === parentElement.id) {
                      return { ...element, children: reorderedChildren }
                    }
                    if (element.children) {
                      return { ...element, children: updateElement(element.children) }
                    }
                    return element
                  })
                }
                return updateElement(prev)
              })

              // Update the database order
              if (activeElementInBuilder.type === 'lesson' && parentElement.type === 'course') {
                try {
                  const lessonIds = reorderedChildren
                    .filter(child => child.type === 'lesson')
                    .map(child => child.db_id)
                    .filter(Boolean)

                  console.log('🔍 Updating lesson order in database:', {
                    course_id: parentElement.db_id,
                    lesson_ids: lessonIds
                  })

                  const response = await fetch('/api/admin/lessons/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      course_id: parentElement.db_id,
                      lesson_ids: lessonIds
                    }),
                  })

                  if (response.ok) {
                    console.log('✅ Lesson order updated in database')
                  } else {
                    console.error('❌ Failed to update lesson order in database')
                  }
                } catch (error) {
                  console.error('❌ Error updating lesson order:', error)
                }
              }

              // Update the database order for courses within modules
              if (activeElementInBuilder.type === 'course' && parentElement.type === 'module') {
                try {
                  const courseIds = reorderedChildren
                    .filter(child => child.type === 'course')
                    .map(child => child.db_id)
                    .filter(Boolean)

                  console.log('🔍 Updating course order in database:', {
                    module_id: parentElement.db_id,
                    course_ids: courseIds
                  })

                  const response = await fetch('/api/admin/courses/reorder', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      module_id: parentElement.db_id,
                      course_ids: courseIds
                    }),
                  })

                  if (response.ok) {
                    console.log('✅ Course order updated in database')
                  } else {
                    console.error('❌ Failed to update course order in database')
                  }
                } catch (error) {
                  console.error('❌ Error updating course order:', error)
                }
              }
            }
          }
        } else {
          console.log('❌ Different parents, cannot reorder')
        }
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
      if (el.children) {
        el.children.forEach(addItems)
      }
    }
    elements.forEach(addItems)
    return items
  }

  const toggleElementExpansion = (elementId: string) => {
    // First, find the element being toggled to determine its type
    const elementToToggle = findElementById(builderElements, elementId)

    if (!elementToToggle) {
      console.error('Element not found for toggling:', elementId)
      return
    }

    console.log('Toggling element:', elementId, 'Type:', elementToToggle.type, 'Has children:', elementToToggle.children?.length || 0, 'Current expanded state:', elementToToggle.isExpanded)

    const updateElementExpansion = (elements: BuilderElement[]): BuilderElement[] => {
      return elements.map(element => {
        // Check if this is the element we want to toggle
        if (element.id === elementId) {
          console.log('Found element to toggle:', element.title, 'Type:', element.type, 'Current state:', element.isExpanded)
          return { ...element, isExpanded: !element.isExpanded }
        }

        // If this is a module and we're toggling a module, apply accordion behavior
        if (element.type === 'module' && elementToToggle.type === 'module' && element.id !== elementId) {
          // Close all other modules when one is opened, but keep the current one open
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
        onDragEnd={handleDragEnd}
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
                    {unassignedCourses.map((course: any) => (
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
                    {unassignedLessons.map((lesson: any) => (
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
                    {unassignedQuizzes.map((quiz: any) => (
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
            const draggingItem = findElementById(allElements as any[], activeId)

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