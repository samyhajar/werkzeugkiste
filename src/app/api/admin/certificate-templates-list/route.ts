import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

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

    // List certificate templates from storage
    const { data: templates, error } = await supabase.storage
      .from('certificates')
      .list('templates', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'updated_at', order: 'desc' },
      })

    if (error) {
      console.error('Error fetching storage templates:', error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch storage templates: ${error.message}`,
        },
        { status: 500 }
      )
    }

    // Transform the data to match our interface
    const transformedTemplates =
      templates?.map(file => ({
        id: file.id,
        name: file.name,
        path: `templates/${file.name}`,
        updated_at: file.updated_at,
        size: file.metadata?.size || 0,
        size_formatted: file.metadata?.size
          ? `${(file.metadata.size / 1024).toFixed(2)} KB`
          : 'Unknown',
      })) || []

    return NextResponse.json({
      success: true,
      templates: transformedTemplates,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/certificate-templates-list:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
