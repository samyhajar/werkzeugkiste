import { createClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'
import { generateAndStoreModuleCertificate } from '@/lib/certificates/generate-module-certificate'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { userId, showName = true } = await req.json()
    const { moduleId } = await params

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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 1) load user + module data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    const { data: module } = await supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .single()

    if (!userProfile || !module) {
      return NextResponse.json(
        { success: false, error: 'User or module not found' },
        { status: 404 }
      )
    }

    const { certificatePath, certificateNumber, issuedAt } =
      await generateAndStoreModuleCertificate({
        supabase,
        userId,
        moduleId,
        userName: userProfile.full_name ?? 'Unbekannter Benutzer',
        userEmail: userProfile.email ?? undefined,
        moduleTitle: module.title,
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
