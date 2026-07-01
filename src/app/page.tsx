import HomePageStatus from '@/components/shared/HomePageStatus'
import LiveModulesSection from '@/components/shared/LiveModulesSection'
import PartnerSection from '@/components/shared/PartnerSection'
import RegistrationButton from '@/components/shared/RegistrationButton'
import { loadPublicModules } from '@/lib/modules/public-module-data'
import Image from 'next/image'
import { Suspense } from 'react'

export const revalidate = 3600

export default async function Home() {
  const modulesWithCourses = await loadPublicModules()

  return (
    <>
      {/* Hero Banner */}
      <section className="w-full relative">
        <h1 className="sr-only">Die digitale Werkzeugkiste plus</h1>
        <Image
          src="/Header_1900x350_Gesamt.png"
          alt="Die digitale Werkzeugkiste plus"
          width={3958}
          height={729}
          priority
          sizes="100vw"
          className="w-full h-auto object-cover max-h-[22vh] sm:max-h-[40vh] md:max-h-[60vh]"
        />
      </section>

      <Suspense fallback={null}>
        <HomePageStatus />
      </Suspense>

      {/* Modules */}
      <Suspense
        fallback={
          <section id="modules" className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="text-center py-12 sm:py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#486681] mx-auto mb-4"></div>
                <p className="text-gray-600">Module werden geladen...</p>
              </div>
            </div>
          </section>
        }
      >
        <section id="modules" className="w-full pt-16 pb-12">
          <LiveModulesSection
            initialModules={modulesWithCourses}
            userProgress={{}}
            isLoggedIn={false}
          />
        </section>
      </Suspense>

      <PartnerSection />
      <RegistrationButton />
    </>
  )
}
