'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCloudinaryAlt } from '@/hooks/useCloudinaryAlt'
import { Tables } from '@/types/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import LoginModal, { LoginModalRef } from './LoginModal'
import ModuleOverlay from './ModuleOverlay'

type Module = Tables<'modules'> & {
  courses: (Tables<'courses'> & {
    lessons: Tables<'lessons'>[]
    quizzes: Tables<'enhanced_quizzes'>[]
  })[]
}

interface ModuleCardProps {
  module: Module
  progress?: number
  isLoggedIn?: boolean
}

export default function ModuleCard({
  module,
  progress = 0,
  isLoggedIn = false,
}: ModuleCardProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const loginModalRef = useRef<LoginModalRef>(null)

  // Fetch ALT text from Cloudinary, fallback to module title
  const imageAlt = useCloudinaryAlt(module.hero_image, module.title)

  const handleShowLogin = () => {
    loginModalRef.current?.show('login', `/modules/${module.id}`)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on the link, let the link's handler take over
    if ((e.target as HTMLElement).closest('a')) {
      return
    }
    e.preventDefault()
    setShowOverlay(true)
  }

  const handleStartModuleClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation, show overlay instead
    setShowOverlay(true)
  }

  return (
    <>
      <div className="cursor-pointer h-full" onClick={handleCardClick}>
        <Card className="w-full flex flex-col overflow-hidden shadow-lg border-0 rounded-lg hover:shadow-xl transition-shadow duration-300 module-card-hover h-full">
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <Image
              src={module.hero_image || '/placeholder.png'}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>

          <CardContent className="flex-1 flex flex-col p-6">
            <div
              className="flex-1 flex flex-col"
              style={{ minHeight: '200px' }}
            >
              <CardTitle
                className="text-xl font-bold text-[#de0647] mb-4 leading-tight"
                style={{
                  minHeight: '3rem',
                  maxHeight: '3rem',
                  overflow: 'hidden',
                }}
              >
                {module.title}
              </CardTitle>

              <p
                className="text-gray-700 text-sm line-clamp-3 mb-6 leading-relaxed"
                style={{ minHeight: '4.5rem', maxHeight: '4.5rem' }}
              >
                {module.description ||
                  'Auf eigenen digitalen Füssen stehen. Kein Vorwissen notwendig. Für alle geeignet.'}
              </p>

              {isLoggedIn && (
                <div className="space-y-2 mb-4 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Fortschritt
                    </span>
                    <span className="text-sm font-semibold text-[#486681]">
                      {progress}%
                    </span>
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

            <div className="mt-auto">
              <p className="text-lg font-semibold text-gray-600 mb-4 text-right">
                Kostenlos
              </p>
              <Link
                href={`/modules/${module.id}`}
                onClick={handleStartModuleClick}
                className="block w-full border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-800 text-center py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
              >
                {isLoggedIn && progress > 0 ? 'Weiter lernen' : 'Modul Details'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <LoginModal ref={loginModalRef} />

      <ModuleOverlay
        module={module}
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        isLoggedIn={isLoggedIn}
        onStartLogin={handleShowLogin}
      />
    </>
  )
}
