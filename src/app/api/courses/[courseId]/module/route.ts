import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const supabase = await createClient()

    // Get course details to find the module_id
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('module_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get module details
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', course.module_id || '')
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      module: module,
    })
  } catch (error) {
    console.error('Module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
