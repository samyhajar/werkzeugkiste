import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndStoreModuleCertificate } from '@/lib/certificates/generate-module-certificate'
import type { Database } from '@/types/supabase'

type Certificate = Database['public']['Tables']['certificates']['Row']
type User = Database['public']['Tables']['profiles']['Row']
type Course = Database['public']['Tables']['courses']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface CertificateWithDetails extends Certificate {
  user?: { id: string; full_name: string | null }
  module?: { id: string; title: string }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Fetch certificates with user and course information
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*')
      .order('issued_at', { ascending: false })

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch certificates: ${error.message || 'Unknown error'}`,
        },
        { status: 500 }
      )
    }

    // Fetch user and module data separately
    const userIds = [
      ...new Set(certificates?.map((c: Certificate) => c.user_id) || []),
    ]
    const moduleIds = [
      ...new Set(certificates?.map((c: Certificate) => c.module_id) || []),
    ]

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .in('id', moduleIds)

    // Create lookup maps
    const userMap = new Map(
      users?.map((u: { id: string; full_name: string | null }) => [u.id, u]) ||
        []
    )
    const moduleMap = new Map(
      modules?.map((m: { id: string; title: string }) => [m.id, m]) || []
    )

    // Combine the data
    const certificatesWithDetails: CertificateWithDetails[] =
      certificates?.map((cert: Certificate) => ({
        ...cert,
        user: userMap.get(cert.user_id),
        module: moduleMap.get(cert.module_id),
      })) || []

    return NextResponse.json({
      success: true,
      certificates: certificatesWithDetails || [],
    })
  } catch (error) {
    console.error('Error in certificates API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Admin check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const profileData = profile as Pick<Profile, 'role'> | null
    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Parse input
    const body = await request.json().catch(() => ({}))
    const {
      userId,
      moduleId,
      templateId,
      showName = true,
      showDate = true,
      showCertificateNumber = true,
    } = body || {}

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'userId and moduleId are required' },
        { status: 400 },
      )
    }

    // Resolve template path from storage list if provided a templateId
    let resolvedTemplatePath: string | undefined
    if (templateId) {
      // If it already looks like a path (contains slash or ends with .pdf), use as-is
      if (typeof templateId === 'string' && (templateId.includes('/') || /\.(pdf|PDF)$/.test(templateId))) {
        resolvedTemplatePath = templateId.startsWith('templates/') ? templateId : `templates/${templateId}`
      } else {
        // Look up by id in the templates folder
        const { data: files } = await supabase.storage
          .from('certificates')
          .list('templates', { limit: 100 })

        const match = files?.find(f => f.id === templateId || f.name === templateId)
        if (match) {
          resolvedTemplatePath = `templates/${match.name}`
        }
      }
    }

    // Fetch user + module details for rendering
    const adminClient = createAdminClient()
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email, first_name')
      .eq('id', userId)
      .single()

    const { data: module } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', moduleId)
      .single()

    const userProfileData = userProfile as Pick<User, 'full_name' | 'email' | 'first_name'> | null
    const moduleData = module as Pick<Database['public']['Tables']['modules']['Row'], 'id' | 'title'> | null

    if (!userProfileData || !moduleData) {
      return NextResponse.json(
        { success: false, error: 'User or module not found' },
        { status: 404 },
      )
    }

    // Generate and store
    // Build a proper display name if profile.full_name is an email
    let userName = userProfileData?.full_name?.trim() || ''
    const looksLikeEmail = (val?: string | null) => !!val && /@/.test(val)
    if (!userName || looksLikeEmail(userName)) {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
        const meta = authUser?.user?.user_metadata || {}
        const composedName = meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || ''
        if (composedName) userName = composedName
      } catch { /* ignore */ }
    }

    const { certificatePath, certificateNumber, issuedAt } = await generateAndStoreModuleCertificate({
      supabase: supabase as any,
      userId,
      moduleId,
      userName: userName || 'Unbekannter Benutzer',
      userEmail: userProfileData.email || undefined,
      moduleTitle: moduleData.title,
      templateOverridePath: resolvedTemplatePath,
      showName,
      displayDate: showDate,
    })

    return NextResponse.json({
      success: true,
      certificatePath,
      certificateNumber,
      issuedAt,
    })
  } catch (error) {
    console.error('Error generating certificate (admin):', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
