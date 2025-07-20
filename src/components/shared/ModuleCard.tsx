import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'

type Course = Tables<'courses'>

interface ModuleCardProps {
  course: Course
  progress?: number
  isLoggedIn?: boolean
}

export default function ModuleCard({ course, progress = 0, isLoggedIn = false }: ModuleCardProps) {
  return (
    <Card className="w-full flex flex-col overflow-hidden shadow-lg border-0 rounded-lg">
      {/* Hero Image */}
      <div className="relative w-full h-48 bg-brand-primary">
        <Image
          src={course.hero_image || '/header-full-computer-final.jpg'}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>

      <CardContent className="flex-1 flex flex-col p-6">
        {/* Title */}
        <CardTitle className="text-xl font-bold text-[#c53030] mb-4 min-h-[3rem] leading-tight">
          {course.title}
        </CardTitle>

        {/* Description */}
        <p className="text-gray-700 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
          {course.description || "Auf eigenen digitalen Füssen stehen. Kein Vorwissen notwendig. Für alle geeignet."}
        </p>

        {/* Progress bar for logged-in users */}
        {isLoggedIn && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Fortschritt</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Price and Button */}
        <div className="mt-auto">
          <p className="text-lg font-semibold text-gray-600 mb-4 text-right">Kostenlos</p>
          <Link
            href={`/modules/${course.id}`}
            className="block w-full bg-brand-secondary hover:bg-brand-secondary-hover text-white text-center py-3 rounded-lg font-medium transition-colors"
          >
            Modul starten
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}