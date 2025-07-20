'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Only update after hydration to prevent server/client mismatch
    setIsAdminPage(pathname.startsWith('/admin'))
    setIsHydrated(true)
  }, [pathname])

  // During SSR and initial hydration, always render with navbar/footer
  // This ensures consistent HTML structure
  if (!isHydrated || !isAdminPage) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <Navbar />
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  // After hydration, render admin layout if needed
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
}