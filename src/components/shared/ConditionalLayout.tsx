'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
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

  // Check if we're on a module page
  const isModulePage = pathname?.startsWith('/modules/')

  // During SSR or before hydration, render without AuthProvider
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col">
        {!isModulePage && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isModulePage && <Footer />}
        {!isModulePage && <ScrollToTopButton />}
      </div>
    )
  }

  // After hydration, render with AuthProvider
  return (
    <AuthProvider>
      <SessionBootstrap />
      <div className="min-h-screen flex flex-col">
        {!isModulePage && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isModulePage && <Footer />}
        {!isModulePage && <ScrollToTopButton />}
      </div>
    </AuthProvider>
  )
}