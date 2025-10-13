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
      .select('full_name, email')
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

    const userName = userProfile?.full_name || 'Unbekannter Benutzer'
    const userEmail = userProfile?.email || undefined

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
