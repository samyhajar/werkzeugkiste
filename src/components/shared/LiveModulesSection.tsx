'use client'

import { useEffect, useState } from 'react'
import ModuleCard from './ModuleCard'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'

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

  const fetchModules = async () => {
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
  }

  useEffect(() => {
    // Set up real-time subscriptions for live updates
    const supabase = getBrowserClient()
    let isSubscribed = true

    // Subscribe to module changes
    const modulesSubscription = supabase
      .channel('home-modules-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules'
        },
        () => {
          if (isSubscribed) {
            console.log('[HomePage] Modules changed, refetching...')
            void fetchModules()
          }
        }
      )
      .subscribe()

    // Subscribe to course changes
    const coursesSubscription = supabase
      .channel('home-courses-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        () => {
          if (isSubscribed) {
            console.log('[HomePage] Courses changed, refetching...')
            void fetchModules()
          }
        }
      )
      .subscribe()

    // Subscribe to lesson changes
    const lessonsSubscription = supabase
      .channel('home-lessons-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons'
        },
        () => {
          if (isSubscribed) {
            console.log('[HomePage] Lessons changed, refetching...')
            void fetchModules()
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      isSubscribed = false
      modulesSubscription.unsubscribe()
      coursesSubscription.unsubscribe()
      lessonsSubscription.unsubscribe()
    }
  }, [])

  return (
    <section id="modules" className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {modules.length > 0 ? (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-600 mb-4">Derzeit sind keine Module verfügbar.</p>
            <p className="text-gray-400 text-sm">Schauen Sie später wieder vorbei.</p>
          </div>
        )}
      </div>
    </section>
  )
}