'use client'

import { useEffect, useState, useCallback } from 'react'
import ModuleCard from './ModuleCard'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'
import { useTableSubscription } from '@/contexts/RealtimeContext'

type Module = Tables<'modules'> & { courses?: any[] }

interface LiveModulesSectionProps {
  initialModules: Module[]
  userProgress: Record<string, number>
  isLoggedIn: boolean
}

export default function LiveModulesSection({
  initialModules,
  userProgress,
  isLoggedIn
}: LiveModulesSectionProps) {
  const [modules, setModules] = useState<Module[]>(initialModules)

  const fetchModules = useCallback(async () => {
    try {
      const response = await fetch('/api/modules')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setModules(data.modules || [])
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }, [])

  // Use centralized subscription management
  useTableSubscription('modules', '*', undefined, fetchModules)
  useTableSubscription('courses', '*', undefined, fetchModules)
  useTableSubscription('lessons', '*', undefined, fetchModules)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {modules.length > 0 ? (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((moduleItem) => (
            <ModuleCard
              key={moduleItem.id}
              module={moduleItem}
              progress={userProgress[moduleItem.id] || 0}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Module verfügbar</h3>
          <p className="text-gray-600">Derzeit sind keine Module verfügbar. Schauen Sie später wieder vorbei.</p>
        </div>
      )}
    </div>
  )
}