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
    <Card className="w-full flex flex-col">
      <Image
        src={course.hero_image || '/placeholder.png'}
        alt={course.title}
        width={400}
        height={220}
        className="w-full h-40 object-cover"
      />
      <CardHeader>
        <CardTitle className="text-brand-secondary min-h-[3rem]">
          {course.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <p className="text-sm line-clamp-3 text-foreground/80 min-h-[4.5rem]">{course.description}</p>

        {/* Progress bar for logged-in users */}
        {isLoggedIn && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-foreground/60">
              <span>Fortschritt</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Kostenlos</p>
          <Link
            href={`/course/${course.id}`}
            className="block text-center border rounded py-1 text-sm hover:bg-accent"
          >
            Modul starten
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}