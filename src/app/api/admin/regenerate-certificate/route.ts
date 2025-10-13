import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { generateAndStoreModuleCertificate } from '@/lib/certificates/generate-module-certificate'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'local-dev-secret'

    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { userId, moduleId } = body

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'userId and moduleId are required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email, first_name')
      .eq('id', userId)
      .single()

    // Ensure module exists (needed for FK constraint)
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', moduleId)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Determine a proper display name; avoid using email when stored in full_name
    let userName = userProfile?.full_name?.trim() || ''
    const userEmail = userProfile?.email || undefined

    // If full_name looks like an email or is empty, try auth metadata
    const looksLikeEmail = (val?: string | null) => !!val && /@/.test(val)
    if (!userName || looksLikeEmail(userName)) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        const meta = authUser?.user?.user_metadata || {}
        const composedName =
          meta.full_name ||
          [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() ||
          ''
        if (composedName) {
          userName = composedName
        }
      } catch (e) {
        // ignore and fall back
      }
    }

    if (!userName) {
      userName = 'Unbekannter Benutzer'
    }

    const { certificatePath, certificateNumber, issuedAt } = await generateAndStoreModuleCertificate({
      supabase,
      userId,
      moduleId,
      userName,
      userEmail,
      moduleTitle: module.title || 'Modul',
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate generated successfully',
      certificatePath,
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
