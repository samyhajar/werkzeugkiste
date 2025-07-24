'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tables } from '@/types/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, Home, User, Award, Settings, LogOut } from 'lucide-react'

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
        "w-full justify-start h-12 px-4 text-left font-normal text-sm",
        isActive
          ? "bg-white/20 text-white border-r-2 border-[#dc0747] hover:bg-white/20"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Link href={href} className="flex items-center gap-3">
        <div className={cn(
          "flex-shrink-0",
          isActive ? "text-white" : "text-blue-100"
        )}>
          {icon}
        </div>
        <span className="flex-1">{children}</span>
      </Link>
    </Button>
  )
}

export default function StudentSidebar({ profile, role, userEmail, onLogout }: StudentSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
      isActive: pathname === "/dashboard"
    },
    {
      href: "/modules",
      icon: <BookOpen className="h-5 w-5" />,
      label: "Module",
      isActive: pathname.startsWith("/modules")
    },
    {
      href: "/certificates",
      icon: <Award className="h-5 w-5" />,
      label: "Zertifikate",
      isActive: pathname.startsWith("/certificates")
    },
    {
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      label: "Profil",
      isActive: pathname.startsWith("/profile")
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#486681] border-r border-[#3e5570] flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 py-6 border-b border-[#3e5570]">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Image
              src="/Logo-digi-CMYK.png"
              alt="Werkzeugkiste Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              Werkzeugkiste
            </h1>
            <p className="text-xs text-blue-100">Student Dashboard</p>
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
      <div className="px-6 py-6 border-t border-[#3e5570] bg-[#3e5570]">
        <div className="space-y-4">
          <div className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#486681] font-medium text-sm">
                {(profile.full_name || userEmail).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate mb-1">
                {profile.full_name || userEmail.split('@')[0]}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20">
                  Student
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-white bg-[#dc0747] border-none hover:bg-[#dc0747]/90"
            onClick={() => void onLogout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>
    </aside>
  )
}