'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'
import { useState } from 'react'

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
}

export default function ModuleOverlay({ module, isOpen, onClose }: ModuleOverlayProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'presenter'>('content')

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
                >
                  Inhalt
                </button>
                <button
                  onClick={() => setActiveTab('presenter')}
                  className={`${
                    activeTab === 'presenter'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
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
                  <ul className="space-y-3">
                    {module.courses.map((course, index) => (
                      <li key={course.id} className="bg-gray-50 rounded-lg p-4 flex items-start">
                        <div className="flex-shrink-0 bg-[#486681] text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <div className="text-center">
                  <Button asChild size="lg" className="w-full bg-[#486681] hover:bg-[#486681]/90 text-white font-bold py-4 text-lg">
                    <Link href={`/modules/${module.id}`}>
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
              {module.presenter_materials_url && (
                <div className="mt-8">
                  <Button asChild className="w-full bg-[#c53030] hover:bg-[#c53030]/90 text-white font-bold py-3">
                    <a href={module.presenter_materials_url} download>
                      PDF Herunterladen
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
