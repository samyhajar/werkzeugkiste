import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Certificate = Database['public']['Tables']['certificates']['Row']
type Module = Pick<Database['public']['Tables']['modules']['Row'], 'id' | 'title'>

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // First, let's just get basic certificates without joins
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })

    const certificatesData = (certificates || []) as Certificate[]

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    // If no certificates exist, return empty array
    if (!certificatesData || certificatesData.length === 0) {
      return NextResponse.json({
        success: true,
        certificates: [],
      })
    }

    const moduleIds = [...new Set(certificatesData.map(cert => cert.module_id))]

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title')
      .in('id', moduleIds)

    if (modulesError) {
      console.error('Error fetching certificate modules:', modulesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    const modulesById = new Map(
      ((modules || []) as Module[]).map(module => [module.id, module])
    )

    // Preserve the existing response shape while avoiding one module query per certificate.
    const certificatesWithModules = certificatesData.map((cert, index) => {
      const moduleData = modulesById.get(cert.module_id) ?? null

      return {
        id: cert.id || `cert-${cert.user_id}-${cert.module_id}-${index}`,
        courseName: moduleData?.title || 'Unknown Module',
        moduleName: moduleData?.title || 'Unknown Module',
        completedDate: cert.issued_at,
        fileUrl: cert.pdf_url,
        status: 'completed' as const,
        score: 100, // Default score for completed certificates
      }
    })

    return NextResponse.json({
      success: true,
      certificates: certificatesWithModules,
    })
  } catch (error) {
    console.error('Student certificates API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
