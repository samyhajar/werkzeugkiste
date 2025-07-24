'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tables } from '@/types/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, Home, User, Award, LogOut } from 'lucide-react'

type Profile = Tables<'profiles'>

interface StudentSidebarProps {
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
        'w-full justify-start gap-3 px-4 py-3 text-left font-medium transition-colors',
        isActive
          ? 'bg-[#486681] text-white hover:bg-[#3a5268]'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Link href={href}>
        {icon}
        {children}
      </Link>
    </Button>
  )
}

export default function StudentSidebar({ profile, role: _role, userEmail, onLogout }: StudentSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#486681] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {profile.full_name || 'Student'}
            </div>
            <div className="text-sm text-gray-500">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavItem
          href="/modules"
          icon={<BookOpen className="w-5 h-5" />}
          isActive={pathname.startsWith('/modules')}
        >
          Module
        </NavItem>

        <NavItem
          href="/certificates"
          icon={<Award className="w-5 h-5" />}
          isActive={pathname.startsWith('/certificates')}
        >
          Zertifikate
        </NavItem>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </Button>
      </div>
    </aside>
  )
}