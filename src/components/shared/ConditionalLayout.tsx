'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import Navbar from './Navbar'
import Footer from './Footer'
import SessionBootstrap from './SessionBootstrap'
import ScrollToTopButton from './ScrollToTopButton'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if we're on a module page or admin page
  const isModulePage = pathname?.startsWith('/modules/')
  const isAdminPage = pathname?.startsWith('/admin')

  // During SSR or before hydration, render a minimal layout without AuthProvider
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Only render Navbar and other auth-dependent components after hydration */}
        <main className="flex-1">{children}</main>
        {!isModulePage && !isAdminPage && <Footer />}
        {!isModulePage && !isAdminPage && <ScrollToTopButton />}
      </div>
    )
  }

  // After hydration, render with AuthProvider and RealtimeProvider
  // Include SessionBootstrap for all pages to ensure proper auth sync
  return (
    <AuthProvider>
      <RealtimeProvider>
        <SessionBootstrap />
        <div className="min-h-screen">
          {!isModulePage && !isAdminPage && <Navbar />}
          <main className={`flex-1 ${!isModulePage && !isAdminPage ? 'pt-24' : ''}`}>{children}</main>
          {!isModulePage && !isAdminPage && <Footer />}
          {!isModulePage && !isAdminPage && <ScrollToTopButton />}
        </div>
      </RealtimeProvider>
    </AuthProvider>
  )
}