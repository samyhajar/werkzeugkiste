'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'
import { useState } from 'react'
import { X, ChevronDown, ChevronRight, Book, FileText } from 'lucide-react'

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

export default function ModuleOverlay({ module, isOpen, onClose, isLoggedIn, onStartLogin }: ModuleOverlayProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'presenter'>('content')
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

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

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-64 w-full">
          <Image
            src={module.hero_image || '/placeholder.png'}
            alt={module.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl font-bold text-white leading-tight">{module.title}</h1>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`${
                    activeTab === 'content'
                      ? 'border-[#de0647] text-[#de0647] bg-red-50/50'
                      : 'border-transparent text-gray-600 hover:text-[#486681] hover:border-gray-300 hover:bg-gray-50/50'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-lg rounded-t-lg transition-all duration-200`}
                >
                  Inhalt
                </button>
                <button
                  onClick={() => setActiveTab('presenter')}
                  className={`${
                    activeTab === 'presenter'
                      ? 'border-[#de0647] text-[#de0647] bg-red-50/50'
                      : 'border-transparent text-gray-600 hover:text-[#486681] hover:border-gray-300 hover:bg-gray-50/50'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-lg rounded-t-lg transition-all duration-200`}
                >
                  Unterlagen für Vortragende
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'content' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Voraussetzungen</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {module.description || 'Für dieses Modul sind keine besonderen Vorkenntnisse erforderlich.'}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inhalt</h2>
                  <div className="space-y-3">
                    {module.courses.map((course, index) => {
                      const isExpanded = expandedCourses.has(course.id)
                      return (
                        <div key={course.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleCourse(course.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-[#486681] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-4">
                                {index + 1}
                              </div>
                              <h3 className="font-semibold text-gray-800 text-left">{course.title}</h3>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-600" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-200">
                              <div className="pt-4 space-y-2">
                                {course.lessons.length > 0 ? (
                                  course.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center py-2 px-3 bg-white rounded-md">
                                      <Book className="h-4 w-4 text-[#486681] mr-3 flex-shrink-0" />
                                      <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center py-2 px-3 bg-white rounded-md">
                                    <FileText className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                                    <span className="text-sm text-gray-500 italic">Keine Lektionen verfügbar</span>
                                  </div>
                                )}

                                {course.quizzes.length > 0 && (
                                  <div className="mt-3 pt-2 border-t border-gray-100">
                                    <div className="text-xs font-semibold text-gray-600 mb-2">Quiz:</div>
                                    {course.quizzes.map((quiz) => (
                                      <div key={quiz.id} className="flex items-center py-2 px-3 bg-blue-50 rounded-md">
                                        <div className="h-4 w-4 bg-blue-500 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                                          <span className="text-xs text-white font-bold">?</span>
                                        </div>
                                        <span className="text-sm text-blue-700 flex-1">{quiz.title}</span>
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
                <div className="text-center">
                  <Button asChild size="lg" className="w-full bg-[#486681] hover:bg-[#486681]/90 text-white font-bold py-4 text-lg">
                    <Link href={`/modules/${module.id}`} onClick={handleStartClick}>
                      Modul starten
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presenter' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Materialien für Vortragende</h2>
              <div className="prose max-w-none">
                {module.presenter_materials_content || 'Für dieses Modul sind keine besonderen Materialien für Vortragende verfügbar.'}
              </div>
              {module.presenter_materials_urls && Array.isArray(module.presenter_materials_urls) && module.presenter_materials_urls.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">PDF Materialien</h3>
                  {module.presenter_materials_urls
                    .filter((item): item is { url: string; title: string } =>
                      typeof item === 'object' && item !== null &&
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
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
