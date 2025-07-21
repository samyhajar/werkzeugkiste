import { Card, CardContent, CardTitle } from '@/components/ui/card'
// import { CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'

type Module = Tables<'modules'>

interface ModuleCardProps {
  module: Module
  progress?: number
  isLoggedIn?: boolean
}

export default function ModuleCard({ module, progress = 0, isLoggedIn = false }: ModuleCardProps) {
  return (
    <Card className="w-full flex flex-col overflow-hidden shadow-lg border-0 rounded-lg">
      {/* Hero Image */}
      <div className="relative w-full h-48 bg-brand-primary">
        <Image
          src="/header-full-computer-final.jpg"
          alt={module.title}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="flex-1 flex flex-col p-6">
        {/* Fixed height content area */}
        <div className="flex flex-col">
          {/* Title - Fixed height */}
          <CardTitle className="text-xl font-bold text-[#c53030] mb-4 h-[3.5rem] leading-tight flex items-start">
            {module.title}
          </CardTitle>

          {/* Description - Fixed height */}
          <div className="h-[4.5rem] mb-6">
            <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
              {module.description || "Auf eigenen digitalen Füssen stehen. Kein Vorwissen notwendig. Für alle geeignet."}
            </p>
          </div>

          {/* Progress bar for logged-in users - Fixed height */}
          <div className="h-[4.5rem] mb-6">
            {isLoggedIn && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>Fortschritt</span>
                  <span className="text-green-600">{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  variant="success"
                  size="default"
                  className="h-3 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Price and Button - Always at bottom */}
        <div className="mt-auto">
          <p className="text-lg font-semibold text-gray-600 mb-4 text-right">Kostenlos</p>
          <Link
            href={`/modules/${module.id}`}
            className="block w-full border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-800 text-center py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
          >
            Modul starten
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}