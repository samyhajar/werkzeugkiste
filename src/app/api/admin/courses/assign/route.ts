import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AssignCourseRequest {
  elementId: string
  parentId: string
  scope: string
}

export async function POST(request: NextRequest) {
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

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { elementId, parentId, scope } =
      (await request.json()) as AssignCourseRequest

    if (!elementId || !parentId) {
      return NextResponse.json(
        { success: false, error: 'Element ID and Parent ID are required' },
        { status: 400 }
      )
    }

    // Determine the parent type and update accordingly
    const updateData: any = {}

    if (scope === 'module') {
      // Assign to module
      updateData.module_id = parentId
    } else {
      // Courses can only be assigned to modules
      return NextResponse.json(
        { success: false, error: 'Courses can only be assigned to modules' },
        { status: 400 }
      )
    }

    // Update the course to assign it to the parent
    const { data: course, error } = await (supabase as any)
      .from('courses')
      .update(updateData)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning course:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error('Error in assign course API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
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

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { course_id, module_id } = (await request.json()) as {
      course_id: string
      module_id: string
    }

    if (!course_id || !module_id) {
      return NextResponse.json(
        { success: false, error: 'Course ID and Module ID are required' },
        { status: 400 }
      )
    }

    // Update the course to assign it to the module
    const { data: course, error } = await (supabase as any)
      .from('courses')
      .update({ module_id })
      .eq('id', course_id)
      .select()
      .single()

    if (error) {
      console.error('Error assigning course to module:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error('Error in assign course API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
