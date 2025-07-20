import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all published modules
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching modules:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      modules: modules || [],
    })
  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
