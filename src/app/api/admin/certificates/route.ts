import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface Certificate {
  id: string
  user_id: string
  module_id: string
  issued_at: string | null
  pdf_url: string
  show_name: boolean | null
  name_used: string | null
  meta: any
}

interface User {
  id: string
  full_name: string | null
}

interface Course {
  id: string
  title: string
}

interface CertificateWithDetails extends Certificate {
  user?: User
  module?: {
    id: string
    title: string
  }
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

    if (profileError || !profile || profile.role !== 'admin') {
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
    const userMap = new Map(users?.map((u: User) => [u.id, u]) || [])
    const moduleMap = new Map(modules?.map((m: any) => [m.id, m]) || [])

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
