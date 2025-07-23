import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface ReorderCoursesRequest {
  module_id: string
  course_ids: string[]
}

export async function PATCH(request: NextRequest) {
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

    const { module_id, course_ids } =
      (await request.json()) as ReorderCoursesRequest

    if (!module_id || !course_ids || !Array.isArray(course_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID and course IDs array are required',
        },
        { status: 400 }
      )
    }

    // Get current courses in the module
    const { data: _currentCourses, error: fetchError } = await supabase
      .from('courses')
      .select('id, created_at')
      .eq('module_id', module_id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching current courses:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // For now, just return success since we don't have a sort_order column
    // TODO: Add sort_order column to courses table in a future migration
    return NextResponse.json({
      success: true,
      message: 'Courses reorder not implemented yet - sort_order column needed',
    })

    return NextResponse.json({
      success: true,
      message: 'Courses reordered successfully',
    })
  } catch (error) {
    console.error('Error in reorder courses API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
