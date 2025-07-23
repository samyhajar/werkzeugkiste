import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

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

    const { module_id, course_ids } = await request.json()

    if (!module_id || !course_ids || !Array.isArray(course_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID and course IDs array are required',
        },
        { status: 400 }
      )
    }

    // Get current orders of all courses in the module
    const { data: currentCourses, error: fetchError } = await supabase
      .from('courses')
      .select('id, order')
      .eq('module_id', module_id)
      .order('order', { ascending: true })

    if (fetchError) {
      console.error('Error fetching current courses:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // Create a map of current orders
    const currentOrderMap = new Map()
    currentCourses?.forEach(course => {
      currentOrderMap.set(course.id, course.order)
    })

    // Update orders incrementally
    for (let i = 0; i < course_ids.length; i++) {
      const courseId = course_ids[i]
      const currentOrder = currentOrderMap.get(courseId) || 0
      const newOrder = i + 1

      // Only update if order actually changed
      if (currentOrder !== newOrder) {
        const { error } = await supabase
          .from('courses')
          .update({ order: newOrder })
          .eq('id', courseId)
          .eq('module_id', module_id)

        if (error) {
          console.error('Error updating course order:', error)
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          )
        }
      }
    }

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
