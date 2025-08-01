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

  // Check if we're on a module page, admin page, or auth page
  const isModulePage = pathname?.startsWith('/modules/')
  const isAdminPage = pathname?.startsWith('/admin')
  const isAuthPage = pathname?.startsWith('/auth')

  // For admin pages, always provide AuthProvider even during SSR
  // Admin pages don't need real-time updates, so we skip RealtimeProvider
  if (isAdminPage) {
    return (
      <AuthProvider>
        <SessionBootstrap />
        <div className="min-h-screen">
          <main className="flex-1">{children}</main>
        </div>
      </AuthProvider>
    )
  }

  // For auth pages, provide minimal layout without navbar/footer to avoid confusion during auth flows
  if (isAuthPage) {
    return (
      <AuthProvider>
        <SessionBootstrap />
        <div className="min-h-screen">
          <main className="flex-1">{children}</main>
        </div>
      </AuthProvider>
    )
  }

  // Always wrap in AuthProvider to prevent useAuth hook errors
  // But conditionally render components based on hydration status
  return (
    <AuthProvider>
      <RealtimeProvider>
        <SessionBootstrap />
        <div className="min-h-screen">
          {/* Always render Navbar (it handles its own hydration) to ensure LoginModal has AuthProvider context */}
          {!isModulePage && <Navbar />}
          <main className={`flex-1 ${!isModulePage ? 'pt-24' : ''}`}>
            {children}
          </main>
          {!isModulePage && <Footer />}
          {!isModulePage && <ScrollToTopButton />}
        </div>
      </RealtimeProvider>
    </AuthProvider>
  )
}