import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Certificate = Database['public']['Tables']['certificates']['Row']
type User = Database['public']['Tables']['profiles']['Row']
type Course = Database['public']['Tables']['courses']['Row']

interface CertificateWithDetails extends Certificate {
  user?: { id: string; full_name: string | null }
  course?: { id: string; title: string } // Keep as 'course' for API compatibility
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
        course: moduleMap.get(cert.module_id), // Keep as 'course' for API compatibility
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
