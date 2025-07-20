'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, LogOut } from 'lucide-react'
import LoginModal from './LoginModal'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser-client'

const links = [
  { href: '/digi-sammlung', label: 'Digi-Sammlung' },
  { href: '/fragen', label: 'Fragen' },
  { href: '/ueber-uns', label: 'Über Uns' },
]

interface Module {
  id: string
  title: string
  description: string | null
  hero_image: string | null
  status: 'draft' | 'published'
}

interface UserProfile {
  id: string
  full_name: string | null
  role: string | null
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [forceShowButton, setForceShowButton] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const modulesRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const supabase = getBrowserClient()

  // Force show login button after 3 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !user) {
        setForceShowButton(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [loading, user])

  // Debug logging
  useEffect(() => {
    console.log('Navbar state:', { user: user?.email, loading, userProfile, forceShowButton })
  }, [user, loading, userProfile, forceShowButton])

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    } else {
      setUserProfile(null)
    }
  }, [user])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    }
  }

  // Fetch modules when dropdown opens
  useEffect(() => {
    if (isModulesOpen && modules.length === 0) {
      fetchModules()
    }
  }, [isModulesOpen, modules.length])

  const fetchModules = async () => {
    setModulesLoading(true)
    try {
      const response = await fetch('/api/modules', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setModules(data.modules || [])
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setModulesLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('[Navbar] Starting logout process...')

      // Close user menu immediately for better UX
      setIsUserMenuOpen(false)
      setUserProfile(null)

      // Use AuthContext's comprehensive logout
      await signOut()

      console.log('[Navbar] Redirecting to home...')
      window.location.href = '/'

    } catch (error) {
      console.error('[Navbar] Error during logout:', error)
      // Force redirect even if logout fails
      window.location.href = '/'
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

  // Helper function to get display name
  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  // Helper function to get user role
  const getUserRole = () => {
    return userProfile?.role || user?.user_metadata?.role || 'student'
  }

  return (
    <>
      <nav className="bg-brand-primary shadow-sm border-b border-brand-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/file.svg"
                alt="Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <span className="text-xl font-bold text-white">Werkzeugkiste</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-blue-100 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}

              {/* Lernmodule Dropdown */}
              <div className="relative" ref={modulesRef}>
                <button
                  onClick={() => setIsModulesOpen(!isModulesOpen)}
                  className="flex items-center text-white hover:text-blue-100 transition-colors duration-200"
                >
                  Lernmodule
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isModulesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModulesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="py-2">
                      {modulesLoading ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Module werden geladen...
                        </div>
                      ) : modules.length > 0 ? (
                        modules.map((module) => (
                          <Link
                            key={module.id}
                            href={`/modules/${module.id}`}
                            className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                            onClick={() => setIsModulesOpen(false)}
                          >
                            <div className="font-medium">{module.title}</div>
                            {module.description && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {module.description}
                              </div>
                            )}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          Keine Module verfügbar
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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

                        {getUserRole() === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        )}

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
                <button
                  onClick={() => {
                    console.log('Login button clicked!')
                    setIsLoginModalOpen(true)
                  }}
                  className="text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 cursor-pointer"
                  style={{
                    backgroundColor: '#de0449',
                    borderColor: '#de0449'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c5043e'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#de0449'
                  }}
                >
                  Einloggen
                </button>
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
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Lernmodule Section */}
                <div className="border-t border-brand-primary-hover pt-2 mt-2">
                  <div className="px-3 py-2 text-blue-100 text-sm font-medium">Lernmodule</div>
                  {modules.length > 0 ? (
                    modules.map((module) => (
                      <Link
                        key={module.id}
                        href={`/modules/${module.id}`}
                        className="block px-6 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 text-sm"
                        onClick={() => setIsOpen(false)}
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

                    {getUserRole() === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-white hover:text-blue-100 hover:bg-brand-primary-hover rounded-md transition-colors duration-200 mb-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}

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
                      console.log('Mobile login button clicked!')
                      setIsOpen(false)
                      setIsLoginModalOpen(true)
                    }}
                    className="block w-full text-left px-3 py-2 text-white font-medium rounded-lg transition-colors duration-200 mt-2"
                    style={{
                      backgroundColor: '#de0449'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c5043e'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#de0449'
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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}