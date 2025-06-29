'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tables } from '@/types/supabase'

type Profile = Tables<'profiles'>

interface StudentHeaderProps {
  profile: Profile
  role: string
  userEmail: string
  onLogout: () => void
}

export default function StudentHeader({ profile, role, userEmail, onLogout }: StudentHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-background">
      <div className="max-w-[900px] mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-brand-primary">
              Digi+ Learning Platform
            </h1>
            <p className="text-foreground/60 text-sm">Student Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {profile.full_name || userEmail}
              </p>
              <Badge variant="secondary" className="text-xs">
                {role}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onLogout()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}