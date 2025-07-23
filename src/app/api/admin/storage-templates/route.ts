import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET() {
  try {
    const supabase = await createClient()

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
        updated_at: file.updated_at,
        size: file.metadata?.size || 0,
      })) || []

    return NextResponse.json({
      success: true,
      templates: transformedTemplates,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/storage-templates:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
