'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'
// Removed SessionBootstrap to prevent any auth sync side-effects on focus/tab visibility
import ScrollToTopButton from './ScrollToTopButton'
import ImageProtection from './ImageProtection'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Check if we're on a module page, admin page, or auth page
  const isModulePage = pathname?.startsWith('/modules/')
  const isModulePrintPage =
    pathname?.startsWith('/modules/') && pathname?.endsWith('/print')
  const isAdminPage = pathname?.startsWith('/admin')
  const isAuthPage = pathname?.startsWith('/auth')

  if (isModulePrintPage) {
    return <>{children}</>
  }

  const globalEnhancements = (
    <>
      <Script
        src="https://webcachex-eu.datareporter.eu/loader/v2/cmp-load.js?url=32870081-646d-477e-98ac-205b44d9c2f1.jEOudZRWor42.Jap"
        strategy="afterInteractive"
      />
      <ImageProtection />
    </>
  )

  // For admin pages, always provide AuthProvider even during SSR
  if (isAdminPage) {
    return (
      <AuthProvider>
        {globalEnhancements}
        <div className="min-h-screen">
          <div className="flex-1">{children}</div>
        </div>
      </AuthProvider>
    )
  }

  // For auth pages, provide minimal layout without navbar/footer to avoid confusion during auth flows
  if (isAuthPage) {
    return (
      <AuthProvider>
        {globalEnhancements}
        <div className="min-h-screen">
          <a className="skip-link" href="#main-content">
            Zum Inhalt springen
          </a>
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
        </div>
      </AuthProvider>
    )
  }

  // Always wrap in AuthProvider to prevent useAuth hook errors
  // But conditionally render components based on hydration status
  return (
    <AuthProvider>
      {globalEnhancements}
      <div className="min-h-screen">
        <a className="skip-link" href="#main-content">
          Zum Inhalt springen
        </a>
        {/* Always render Navbar (it handles its own hydration) to ensure LoginModal has AuthProvider context */}
        {!isModulePage && <Navbar />}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 ${!isModulePage ? 'pt-16 md:pt-24' : ''}`}
        >
          {children}
        </main>
        {!isModulePage && <Footer />}
        {!isModulePage && <ScrollToTopButton />}
      </div>
    </AuthProvider>
  )
}
