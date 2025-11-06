import { createClient } from '@/lib/supabase/server-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { generateAndStoreModuleCertificate } from '@/lib/certificates/generate-module-certificate'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Module = Database['public']['Tables']['modules']['Row']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { userId, showName = true } = await req.json()
    const { moduleId } = await params

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin using profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 1) load user + module data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email, first_name')
      .eq('id', userId)
      .single()

    const { data: module } = await supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .single()

    const userProfileData = userProfile as Pick<Profile, 'full_name' | 'email' | 'first_name'> | null
    const moduleData = module as Pick<Module, 'title'> | null

    if (!userProfileData || !moduleData) {
      return NextResponse.json(
        { success: false, error: 'User or module not found' },
        { status: 404 }
      )
    }

    // Build a proper display name (avoid email-like full_name)
    let userName = userProfileData?.full_name?.trim() || ''
    const looksLikeEmail = (val?: string | null) => !!val && /@/.test(val)
    if (!userName || looksLikeEmail(userName)) {
      try {
        const { data: adminUser } = await adminSupabase.auth.admin.getUserById(userId)
        const meta = adminUser?.user?.user_metadata || {}
        const composedName =
          meta.full_name ||
          [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || ''
        if (composedName) userName = composedName
      } catch { /* ignore */ }
    }

    const { certificatePath, certificateNumber, issuedAt } =
      await generateAndStoreModuleCertificate({
        supabase: supabase as any,
        userId,
        moduleId,
        userName: userName || 'Unbekannter Benutzer',
        userEmail: userProfileData.email ?? undefined,
        moduleTitle: moduleData.title,
        showName,
      })

    return NextResponse.json({
      success: true,
      url: certificatePath,
      certificateId: certificatePath,
      certificateNumber,
      issuedAt,
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
