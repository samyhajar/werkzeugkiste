'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  if (isAdminPage) {
    // Admin pages: no navbar/footer, full height
    return (
      <div className="min-h-screen w-full">
        {children}
      </div>
    )
  }

  // Regular pages: with navbar and footer
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </>
  )
}