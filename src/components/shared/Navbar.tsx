'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'
import { useRouter } from 'next/navigation'

interface ModuleData {
  id: string
  title: string
  description: string
  image_url: string
}

export default function Navbar() {
  const { user, loading, signOut, isAdmin, getDisplayName, getUserRole } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [modules, setModules] = useState<ModuleData[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [forceShowButton, setForceShowButton] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const modulesRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserClient> | null>(null)
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize Supabase client only in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(getBrowserClient())
    }
  }, [])

  // Handle scroll effect for navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Force show login button after 3 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) {
        setForceShowButton(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [loading, user])

  // Fetch modules on component mount (for both mobile and desktop)
  useEffect(() => {
    if (modules.length === 0) {
      void fetchModules()
    }
  }, [modules.length])

  // Also fetch modules when dropdown opens (backup for any edge cases)
  useEffect(() => {
    if (isModulesOpen && modules.length === 0) {
      void fetchModules()
    }
  }, [isModulesOpen, modules.length])

  const fetchModules = async () => {
    // Prevent duplicate requests
    if (fetchInProgress.current) {
      return
    }

    // Debounce requests
    const now = Date.now()
    if (now - lastFetchTime.current < 2000) {
      return
    }

    fetchInProgress.current = true
    lastFetchTime.current = now

    try {
      const response = await fetch('/api/modules')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setModules(data.modules || [])
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      fetchInProgress.current = false
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // The signOut function in AuthContext will handle the redirect
    } catch (error) {
      console.error('[Navbar] Error during logout:', error)
      // Force redirect on error
      router.push('/')
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (modulesRef.current && !modulesRef.current.contains(event.target as Node)) {
        setIsModulesOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isOpen || isModulesOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isModulesOpen, isUserMenuOpen])

  const handleModuleClick = (e: React.MouseEvent, moduleId: string) => {
    if (!user) {
      e.preventDefault()
      setIsLoginModalOpen(true)
      setIsModulesOpen(false)
      setIsOpen(false)
    }
  }

  // Don't render during SSR or if not mounted yet
  if (!mounted) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <img
                  className="h-8 w-auto"
                  src="/Logo-digi-CMYK.png"
                  alt="Logo"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6e859a]"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <img
                  className="h-8 w-auto"
                  src="/Logo-digi-CMYK.png"
                  alt="Logo"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/" className="text-gray-900 hover:text-[#6e859a] px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Home
                </Link>

                {/* Modules Dropdown */}
                <div className="relative" ref={modulesRef}>
                  <button
                    onClick={() => setIsModulesOpen(!isModulesOpen)}
                    className="text-gray-900 hover:text-[#6e859a] px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    Module
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isModulesOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        {modulesLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-500">Loading modules...</div>
                        ) : modules.length > 0 ? (
                          modules.map((module) => (
                            <Link
                              key={module.id}
                              href={`/modules/${module.id}`}
                              onClick={(e) => handleModuleClick(e, module.id)}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                            >
                              <div className="font-medium">{module.title}</div>
                              {module.description && (
                                <div className="text-xs text-gray-500 mt-1">{module.description}</div>
                              )}
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">No modules available</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/digi-sammlung" className="text-gray-900 hover:text-[#6e859a] px-3 py-2 text-sm font-medium transition-colors duration-200">
                  DigiSammlung
                </Link>
                <Link href="/ueber-uns" className="text-gray-900 hover:text-[#6e859a] px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Über uns
                </Link>
                <Link href="/fragen" className="text-gray-900 hover:text-[#6e859a] px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Fragen
                </Link>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {loading && !forceShowButton ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6e859a]"></div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="bg-[#6e859a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a7388] transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>{getDisplayName()}</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-500 border-b">
                          <div className="font-medium">{getDisplayName()}</div>
                          <div className="text-xs">{user.email}</div>
                          <div className="text-xs capitalize">{getUserRole()}</div>
                        </div>

                        {isAdmin() ? (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}

                        <Link
                          href="/certificates"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Certificates
                        </Link>

                        <button
                          onClick={() => {
                            void handleLogout()
                            setIsUserMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-[#6e859a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a7388] transition-colors duration-200"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6e859a]"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link href="/" className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200">
                Home
              </Link>

              {/* Mobile Modules */}
              <div>
                <button
                  onClick={() => setIsModulesOpen(!isModulesOpen)}
                  className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200 w-full text-left flex items-center justify-between"
                >
                  Module
                  <svg className={`h-4 w-4 transform transition-transform ${isModulesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isModulesOpen && (
                  <div className="pl-6 space-y-1">
                    {modulesLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-500">Loading modules...</div>
                    ) : modules.length > 0 ? (
                      modules.map((module) => (
                        <Link
                          key={module.id}
                          href={`/modules/${module.id}`}
                          onClick={(e) => {
                            handleModuleClick(e, module.id)
                            setIsOpen(false)
                          }}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-[#6e859a] hover:bg-gray-50 transition-colors duration-200"
                        >
                          {module.title}
                        </Link>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No modules available</div>
                    )}
                  </div>
                )}
              </div>

              <Link href="/digi-sammlung" className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200">
                DigiSammlung
              </Link>
              <Link href="/ueber-uns" className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200">
                Über uns
              </Link>
              <Link href="/fragen" className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200">
                Fragen
              </Link>

              {/* Mobile User Section */}
              <div className="border-t pt-4">
                {loading && !forceShowButton ? (
                  <div className="px-3 py-2 flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6e859a]"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <div className="font-medium">{getDisplayName()}</div>
                      <div className="text-xs">{user.email}</div>
                      <div className="text-xs capitalize">{getUserRole()}</div>
                    </div>

                    {isAdmin() ? (
                      <Link
                        href="/admin"
                        className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}

                    <Link
                      href="/certificates"
                      className="text-gray-900 hover:text-[#6e859a] block px-3 py-2 text-base font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      My Certificates
                    </Link>

                    <button
                      onClick={() => {
                        void handleLogout()
                        setIsOpen(false)
                      }}
                      className="text-red-700 hover:text-red-800 block px-3 py-2 text-base font-medium transition-colors duration-200 w-full text-left"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true)
                      setIsOpen(false)
                    }}
                    className="bg-[#6e859a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a7388] transition-colors duration-200 w-full"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}