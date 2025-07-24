'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Tables } from '@/types/supabase'
import LoginModal from './LoginModal'

type Module = Tables<'modules'>

interface ModuleCardProps {
  module: Module
  progress?: number
  isLoggedIn?: boolean
}

export default function ModuleCard({ module, progress = 0, isLoggedIn = false }: ModuleCardProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleStartModule = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      setShowLoginModal(true)
    }
  }

  return (
    <>
      <Card className="w-full flex flex-col overflow-hidden shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 module-card-hover">
        {/* Hero Image */}
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <Image
            src={module.hero_image || '/placeholder.png'}
            alt={module.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        <CardContent className="flex-1 flex flex-col p-6">
          <div className="flex-1 flex flex-col">
            {/* Title */}
            <CardTitle className="text-xl font-bold text-[#c53030] mb-4 min-h-[3rem] leading-tight">
              {module.title}
            </CardTitle>

            {/* Description */}
            <p className="text-gray-700 text-sm line-clamp-3 mb-6 leading-relaxed">
              {module.description || "Auf eigenen digitalen Füssen stehen. Kein Vorwissen notwendig. Für alle geeignet."}
            </p>

            {/* Simple Progress bar for logged-in users */}
            {isLoggedIn && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Fortschritt</span>
                  <span className="text-sm font-semibold text-[#486681]">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  variant="custom"
                  size="lg"
                  className="h-3"
                  progressColor={progress > 0 ? '#486681' : '#e5e7eb'}
                />
              </div>
            )}
          </div>

          {/* Price and Button */}
          <div className="mt-auto">
            <p className="text-lg font-semibold text-gray-600 mb-4 text-right">Kostenlos</p>
            <Link
              href={isLoggedIn ? `/modules/${module.id}` : '#'}
              onClick={handleStartModule}
              className="block w-full border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-800 text-center py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
            >
              {isLoggedIn && progress > 0 ? 'Weiter lernen' : 'Modul starten'}
            </Link>
          </div>
        </CardContent>
      </Card>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  )
}