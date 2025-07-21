'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tables } from '@/types/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Profile = Tables<'profiles'>

interface AdminSidebarProps {
  profile: Profile
  role: string
  userEmail: string
  onLogout: () => void
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  isActive?: boolean
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start h-12 px-4 text-left font-normal",
        isActive
          ? "bg-[#486681]/10 text-[#486681] border-r-2 border-[#486681] hover:bg-[#486681]/10"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Link href={href} className="flex items-center gap-3">
        <div className={cn(
          "flex-shrink-0",
          isActive ? "text-[#486681]" : "text-gray-500"
        )}>
          {icon}
        </div>
        <span className="flex-1">{children}</span>
      </Link>
    </Button>
  )
}

export default function AdminSidebar({ profile, role, userEmail, onLogout }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/admin",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
        </svg>
      ),
      label: "Dashboard",
      isActive: pathname === "/admin"
    },
    {
      href: "/admin/modules",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: "Modules",
      isActive: pathname.startsWith("/admin/modules")
    },
    {
      href: "/admin/courses",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: "Courses",
      isActive: pathname.startsWith("/admin/courses")
    },
    {
      href: "/admin/lessons",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Lessons",
      isActive: pathname.startsWith("/admin/lessons")
    },
    {
      href: "/admin/quizzes",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: "Quizzes",
      isActive: pathname.startsWith("/admin/quizzes")
    },
    {
      href: "/admin/students",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: "Students",
      isActive: pathname.startsWith("/admin/students")
    },
    {
      href: "/admin/analytics",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: "Analytics",
      isActive: pathname.startsWith("/admin/analytics")
    },
    {
      href: "/admin/certificates",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Certificates",
      isActive: pathname.startsWith("/admin/certificates")
    },
    {
      href: "/admin/settings",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Settings",
      isActive: pathname.startsWith("/admin/settings")
    }
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#486681] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D+</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Digi+ Admin
            </h1>
            <p className="text-xs text-gray-500">Learning Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              isActive={item.isActive}
            >
              {item.label}
            </NavItem>
          ))}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {(profile.full_name || userEmail).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.full_name || userEmail.split('@')[0]}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {role}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
            onClick={() => void onLogout()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}