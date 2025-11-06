import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Course = Database['public']['Tables']['courses']['Row']
type Module = Database['public']['Tables']['modules']['Row']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get course details to find the module_id
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('module_id')
      .eq('id', id)
      .single()

    const courseData = course as Pick<Course, 'module_id'> | null

    if (courseError || !courseData) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get module details
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', courseData.module_id || '')
      .single()

    const moduleData = module as Pick<Module, 'id' | 'title'> | null

    if (moduleError || !moduleData) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      module: moduleData,
    })
  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
