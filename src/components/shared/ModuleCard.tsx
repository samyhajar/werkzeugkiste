import { Card, CardContent, CardTitle } from '@/components/ui/card'
// import { CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'
import { BookOpen, FileText, HelpCircle } from 'lucide-react'

type Module = Tables<'modules'>

interface Course {
  id: string
  title: string
  description: string | null
  lessons: any[]
  quizzes: any[]
}

interface ModuleCardProps {
  module: Module & { courses?: Course[] }
  progress?: number
  isLoggedIn?: boolean
}

export default function ModuleCard({ module, progress = 0, isLoggedIn = false }: ModuleCardProps) {
  const totalCourses = module.courses?.length || 0
  const totalLessons = module.courses?.reduce((total, course) => total + course.lessons.length, 0) || 0
  const totalQuizzes = module.courses?.reduce((total, course) => total + course.quizzes.length, 0) || 0

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
          <div className="h-[4.5rem] mb-4">
            <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
              {module.description || "Auf eigenen digitalen Füssen stehen. Kein Vorwissen notwendig. Für alle geeignet."}
            </p>
          </div>

          {/* Course Information */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>{totalCourses} Kurse</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{totalLessons} Lektionen</span>
            </div>
            {totalQuizzes > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <HelpCircle className="w-4 h-4" />
                <span>{totalQuizzes} Quizze</span>
              </div>
            )}
          </div>

          {/* Progress bar for logged-in users - Fixed height */}
          <div className="h-[4.5rem]">
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