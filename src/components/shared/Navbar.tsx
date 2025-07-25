'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, User, LogOut, Award } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/digi-sammlung', label: 'Digi-Sammlung' },
  { href: '/fragen', label: 'Fragen' },
  { href: '/ueber-uns', label: 'Über uns' },
]

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

  // Don't render during SSR/build time - now using conditional rendering instead of early return
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Werkzeugkiste
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav
          className={`bg-brand-primary transition-all duration-300 ease-in-out ${
            isScrolled
              ? 'shadow-xl border-b-2 border-gray-400'
              : 'shadow-none border-b-0'
          }`}
          style={{
            boxShadow: isScrolled
              ? '0 6px 16px -3px rgba(0, 0, 0, 0.2), 0 3px 8px -2px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              : 'none',
            border: 'none',
            outline: 'none'
          }}
        >
        <div className="w-full px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/Logo-digi-CMYK.png"
                alt="Digi+ Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {links.slice(0, 1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-blue-100 transition-colors duration-200 text-xl font-semibold"
                >
                  {link.label}
                </Link>
              ))}

              {/* Lernmodule Dropdown */}
              <div className="relative" ref={modulesRef}>
                <button
                  onClick={() => setIsModulesOpen(!isModulesOpen)}
                  onMouseEnter={() => setIsModulesOpen(true)}
                  className="flex items-center text-white hover:text-blue-100 transition-colors duration-200 text-xl font-semibold"
                >
                  Lernmodule
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isModulesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModulesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-96 bg-brand-primary rounded-lg shadow-xl border border-brand-primary-hover z-50"
                    onMouseEnter={() => setIsModulesOpen(true)}
                    onMouseLeave={() => setIsModulesOpen(false)}
                  >
                    <div className="py-3">
                      {modulesLoading ? (
                        <div className="px-6 py-4 text-blue-100 text-sm">
                          Module werden geladen...
                        </div>
                      ) : modules.length > 0 ? (
                        modules.map((module) => (
                          <Link
                            key={module.id}
                            href={user ? `/modules/${module.id}` : '#'}
                            onClick={(e) => handleModuleClick(e, module.id)}
                            className="block px-6 py-4 text-white hover:text-blue-100 hover:bg-brand-primary-hover transition-colors text-lg font-semibold"
                          >
                            {module.title}
                          </Link>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-blue-200 text-sm">
                          Keine Module verfügbar
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {links.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-blue-100 transition-colors duration-200 text-xl font-semibold"
                >
                  {link.label}
                </Link>
              ))}

              {/* User Menu or Login Button */}
              {loading && !forceShowButton ? (
                <div className="bg-gray-300 animate-pulse h-10 w-24 rounded-lg"></div>
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-white text-brand-primary hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 border border-gray-200"
                  >
                    <User className="h-4 w-4" />
                    <span>{getDisplayName()}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="font-medium text-gray-900">
                            {getDisplayName()}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 capitalize">
                            {getUserRole()}
                          </div>
                        </div>

                        {isAdmin() ? (
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Dashboard
                          </Link>
                        )}

                        <Link
                          href="/certificates"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Zertifikate
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Abmelden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-8">
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true)
                    }}
                    className="text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 cursor-pointer text-lg"
                    style={{
                      backgroundColor: '#de0446',
                      borderColor: '#de0446'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c5043e'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#de0446'
                    }}
                  >
                    Einloggen
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:text-blue-100 focus:outline-none focus:text-blue-100 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div ref={menuRef} className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-brand-primary border-t border-brand-primary-hover">
                {links.slice(0, 1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 text-xl font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Lernmodule Section */}
                <div className="border-t border-brand-primary-hover pt-2 mt-2">
                  <div className="px-3 py-2 text-blue-100 text-xl font-semibold">Lernmodule</div>
                  {modules.length > 0 ? (
                    modules.map((module) => (
                      <Link
                        key={module.id}
                        href={user ? `/modules/${module.id}` : '#'}
                        onClick={(e) => handleModuleClick(e, module.id)}
                        className="block px-6 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 text-lg font-semibold"
                      >
                        {module.title}
                      </Link>
                    ))
                  ) : (
                    <div className="px-6 py-2 text-blue-200 text-sm">
                      Keine Module verfügbar
                    </div>
                  )}
                </div>

                {links.slice(1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 text-xl font-semibold"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile User Section */}
                {user ? (
                  <div className="border-t border-brand-primary-hover pt-2 mt-2">
                    <div className="px-3 py-2 text-white">
                      <div className="font-medium">
                        {getDisplayName()}
                      </div>
                      <div className="text-sm text-blue-200">{user.email}</div>
                      <div className="text-xs text-blue-300 capitalize">
                        {getUserRole()}
                      </div>
                    </div>

                    {isAdmin() ? (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 mb-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 mb-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}

                    <Link
                      href="/certificates"
                      className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 mb-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Zertifikate
                    </Link>

                    <button
                      onClick={() => {
                        setIsOpen(false)
                        handleLogout()
                      }}
                      className="block w-full text-left px-3 py-2 text-white hover:text-red-200 hover:bg-red-600 rounded-md transition-colors duration-200"
                    >
                      Abmelden
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setIsLoginModalOpen(true)
                    }}
                    className="block w-full text-left px-3 py-2 text-white font-semibold rounded-lg transition-colors duration-200 mt-2 text-lg"
                    style={{
                      backgroundColor: '#de0446'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c5043e'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#de0446'
                    }}
                  >
                    Einloggen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </nav>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}