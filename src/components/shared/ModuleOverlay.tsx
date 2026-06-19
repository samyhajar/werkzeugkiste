'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCloudinaryAlt } from '@/hooks/useCloudinaryAlt'
import { Tables } from '@/types/supabase'
import {
  Book,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import CloudinaryHtmlContent from './CloudinaryHtmlContent'

type Module = Tables<'modules'> & {
  courses: (Tables<'courses'> & {
    lessons: Tables<'lessons'>[]
    quizzes: Tables<'enhanced_quizzes'>[]
  })[]
}

interface ModuleOverlayProps {
  module: Module
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  onStartLogin: () => void
}

export default function ModuleOverlay({
  module,
  isOpen,
  onClose,
  isLoggedIn,
  onStartLogin,
}: ModuleOverlayProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'presenter'>('content')
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const contentTabRef = useRef<HTMLButtonElement>(null)
  const presenterTabRef = useRef<HTMLButtonElement>(null)
  const sortedCourses = [...module.courses].sort((a, b) => {
    const aOrder =
      typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
    const bOrder =
      typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
    const diff = aOrder - bOrder
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id)
  })
  const presenterMaterialsContent = module.presenter_materials_content ?? ''
  const hasPresenterMaterialsContent =
    presenterMaterialsContent.trim().length > 0

  // Fetch ALT text from Cloudinary, fallback to module title
  const imageAlt = useCloudinaryAlt(module.hero_image, module.title)

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const handleStartClick = (e: React.MouseEvent) => {
    // Allow both logged in and guest users to start modules
    // The link will navigate automatically for both cases
  }

  const modulePdfUrl = `/api/modules/${module.id}/pdf`

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return
    }

    event.preventDefault()
    const nextTab =
      event.key === 'Home'
        ? 'content'
        : event.key === 'End'
          ? 'presenter'
          : activeTab === 'content'
            ? 'presenter'
            : 'content'
    setActiveTab(nextTab)
    const nextRef = nextTab === 'content' ? contentTabRef : presenterTabRef
    requestAnimationFrame(() => nextRef.current?.focus())
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl border-0 p-0 shadow-2xl"
      >
        <DialogDescription className="sr-only">
          Details, Inhalte und Materialien für das gewählte Lernmodul.
        </DialogDescription>
        {/* Header */}
        <div className="relative h-64 w-full">
          <Image
            src={module.hero_image || '/placeholder.png'}
            alt={imageAlt}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <DialogTitle className="text-4xl font-bold text-white leading-tight">
              {module.title}
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            aria-label="Moduldetails schließen"
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Mobile: Modul starten button at top */}
          <div className="lg:hidden mb-6">
            <div className="space-y-3">
              <Button
                asChild
                size="lg"
                className="w-full bg-[#486681] hover:bg-[#486681]/90 text-white font-bold py-4 text-lg"
              >
                <Link
                  href={`/modules/${module.id}`}
                  onClick={handleStartClick}
                >
                  Modul starten
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="border-b border-gray-200">
              <div
                role="tablist"
                aria-label="Moduldetails"
                className="-mb-px flex space-x-8"
              >
                <button
                  ref={contentTabRef}
                  type="button"
                  role="tab"
                  id={`module-content-tab-${module.id}`}
                  aria-controls={`module-content-panel-${module.id}`}
                  aria-selected={activeTab === 'content'}
                  tabIndex={activeTab === 'content' ? 0 : -1}
                  onClick={() => setActiveTab('content')}
                  onKeyDown={handleTabKeyDown}
                  className={`${
                    activeTab === 'content'
                      ? 'border-[#de0647] text-[#de0647] bg-red-50/50'
                      : 'border-transparent text-gray-600 hover:text-[#486681] hover:border-gray-300 hover:bg-gray-50/50'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-lg rounded-t-lg transition-all duration-200`}
                >
                  Inhalt
                </button>
                <button
                  ref={presenterTabRef}
                  type="button"
                  role="tab"
                  id={`module-presenter-tab-${module.id}`}
                  aria-controls={`module-presenter-panel-${module.id}`}
                  aria-selected={activeTab === 'presenter'}
                  tabIndex={activeTab === 'presenter' ? 0 : -1}
                  onClick={() => setActiveTab('presenter')}
                  onKeyDown={handleTabKeyDown}
                  className={`${
                    activeTab === 'presenter'
                      ? 'border-[#de0647] text-[#de0647] bg-red-50/50'
                      : 'border-transparent text-gray-600 hover:text-[#486681] hover:border-gray-300 hover:bg-gray-50/50'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-lg rounded-t-lg transition-all duration-200`}
                >
                  Unterlagen für Vortragende
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'content' && (
            <div
              role="tabpanel"
              id={`module-content-panel-${module.id}`}
              aria-labelledby={`module-content-tab-${module.id}`}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Left Column */}
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Voraussetzungen
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {module.description ||
                      'Für dieses Modul sind keine besonderen Vorkenntnisse erforderlich.'}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Inhalt
                  </h2>
                  <div className="space-y-3">
                    {sortedCourses.map((course, index) => {
                      const isExpanded = expandedCourses.has(course.id)
                      return (
                        <div
                          key={course.id}
                          className="bg-gray-50 rounded-lg overflow-hidden"
                        >
                           <button
                             type="button"
                             onClick={() => toggleCourse(course.id)}
                             aria-expanded={isExpanded}
                             aria-controls={`module-overlay-course-${course.id}`}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-[#486681] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-4">
                                {index + 1}
                              </div>
                              <h3 className="font-semibold text-gray-800 text-left">
                                {course.title}
                              </h3>
                            </div>
                            {isExpanded ? (
                              <ChevronDown aria-hidden="true" className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronRight aria-hidden="true" className="h-5 w-5 text-gray-600" />
                            )}
                          </button>

                          {isExpanded && (
                            <div
                              id={`module-overlay-course-${course.id}`}
                              className="px-4 pb-4 border-t border-gray-200"
                            >
                              <div className="pt-4 space-y-2">
                                {course.lessons.length > 0 ? (
                                  course.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center py-2 px-3 bg-white rounded-md"
                                    >
                                      <Book aria-hidden="true" className="h-4 w-4 text-[#486681] mr-3 flex-shrink-0" />
                                      <span className="text-sm text-gray-700 flex-1">
                                        {lesson.title}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center py-2 px-3 bg-white rounded-md">
                                    <FileText aria-hidden="true" className="h-4 w-4 text-gray-500 mr-3 flex-shrink-0" />
                                    <span className="text-sm text-gray-500 italic">
                                      Keine Lektionen verfügbar
                                    </span>
                                  </div>
                                )}

                                {course.quizzes.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-gray-100">
                                    <div className="text-xs font-semibold text-gray-600 mb-2">
                                      Quiz:
                                    </div>
                                    {course.quizzes.map(quiz => (
                                      <div
                                        key={quiz.id}
                                        className="flex items-center py-2 px-3 bg-blue-50 rounded-md"
                                      >
                                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                                          <span className="text-xs text-white font-bold">
                                            ?
                                          </span>
                                        </div>
                                        <span className="text-sm text-blue-700 flex-1">
                                          {quiz.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Desktop: Modul starten button (hidden on mobile) */}
                <div className="text-center hidden lg:block space-y-3">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-[#486681] hover:bg-[#486681]/90 text-white font-bold py-4 text-lg"
                  >
                    <Link
                      href={`/modules/${module.id}`}
                      onClick={handleStartClick}
                    >
                      Modul starten
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presenter' && (
            <div
              role="tabpanel"
              id={`module-presenter-panel-${module.id}`}
              aria-labelledby={`module-presenter-tab-${module.id}`}
              className="space-y-8"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Materialien für Vortragende
              </h2>
              <div className="rounded-lg border border-[#486681]/20 bg-[#486681]/5 p-4">
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="min-h-10 w-full justify-start border-[#486681] bg-white px-3 py-2 text-sm font-semibold leading-tight text-[#486681] hover:bg-[#486681]/10 sm:w-auto sm:text-base"
                >
                  <a href={modulePdfUrl}>
                    <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                    <span>Modul als PDF herunterladen</span>
                  </a>
                </Button>
              </div>
              {hasPresenterMaterialsContent ? (
                <CloudinaryHtmlContent
                  html={presenterMaterialsContent}
                  className="prose max-w-none"
                />
              ) : (
                <div className="prose max-w-none">
                  Für dieses Modul sind keine besonderen Materialien für
                  Vortragende verfügbar.
                </div>
              )}
              {module.presenter_materials_urls &&
                Array.isArray(module.presenter_materials_urls) &&
                module.presenter_materials_urls.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      PDF Materialien
                    </h3>
                    {module.presenter_materials_urls
                      .filter(
                        (item): item is { url: string; title: string } =>
                          typeof item === 'object' &&
                          item !== null &&
                          typeof (item as any).url === 'string' &&
                          typeof (item as any).title === 'string' &&
                          (item as any).url.trim() !== ''
                      )
                      .map((pdf, index) => (
                        <Button
                          key={index}
                          asChild
                          className="w-full bg-[#c53030] hover:bg-[#c53030]/90 text-white font-bold py-3 justify-start"
                        >
                          <a href={pdf.url} download>
                            📄 {pdf.title || `PDF ${index + 1}`}
                          </a>
                        </Button>
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
