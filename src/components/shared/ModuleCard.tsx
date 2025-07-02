import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Tables } from '@/types/supabase'

type Course = Tables<'courses'>

interface ModuleCardProps {
  course: Course
}

export default function ModuleCard({ course }: ModuleCardProps) {
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