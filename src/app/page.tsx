import ModuleCard from '@/components/shared/ModuleCard'
import DummyModuleCard from '@/components/shared/DummyModuleCard'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/supabase'
import { redirect } from 'next/navigation'
import PartnerSection from '@/components/shared/PartnerSection'

type Course = Tables<'courses'>

export const revalidate = 60 // ISR every minute

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = await createClient()
  const { data: fetchedCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .limit(4)

  const courses = fetchedCourses ?? []

  return (
    <>
      {/* Hero Banner */}
      <section className="w-full">
        <Image
          src="/header-full-computer-final.jpg"
          alt="Banner"
          width={1920}
          height={354}
          priority
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Modules */}
      <section id="modules" className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
          Lernmodule
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          {courses.map((course: Course) => (
            <ModuleCard key={course.id} course={course} />
          ))}
          {/* Add placeholders to always show 4 cards */}
          {Array.from({ length: Math.max(0, 4 - courses.length) }).map((_, i) => (
            <DummyModuleCard key={`dummy-${i}`} />
          ))}
        </div>
      </section>

      <PartnerSection />
    </>
  )
}
