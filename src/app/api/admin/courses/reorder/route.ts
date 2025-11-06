import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Course = Pick<Database['public']['Tables']['courses']['Row'], 'module_id' | 'order'>
type CourseOrder = Pick<Database['public']['Tables']['courses']['Row'], 'id' | 'order'>

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
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

    // Check if user is admin
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

    const { courseId, newOrder } = await request.json()

    if (!courseId || typeof newOrder !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Get the current course to find its module_id
    const { data: currentCourse, error: currentError } = await supabase
      .from('courses')
      .select('module_id, order')
      .eq('id', courseId)
      .single()

    const courseData = currentCourse as Course | null

    if (currentError || !courseData) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const moduleId = courseData.module_id
    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: 'Course not assigned to a module' },
        { status: 400 }
      )
    }
    const currentOrder = courseData.order || 0

    // Get all courses in the same module
    const { data: moduleCourses, error: moduleError } = await supabase
      .from('courses')
      .select('id, order')
      .eq('module_id', moduleId)
      .order('order', { ascending: true })

    const coursesData = (moduleCourses || []) as CourseOrder[]

    if (moduleError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module courses' },
        { status: 500 }
      )
    }

    // Calculate new order values
    const updatedCourses = coursesData.map((course, index) => {
      let newOrderValue: number
      const courseOrder = course.order || 0

      if (course.id === courseId) {
        // This is the course being moved
        newOrderValue = newOrder
      } else if (currentOrder < newOrder) {
        // Moving down: shift courses between current and new position up
        if (courseOrder > currentOrder && courseOrder <= newOrder) {
          newOrderValue = courseOrder - 1
        } else {
          newOrderValue = courseOrder
        }
      } else {
        // Moving up: shift courses between new and current position down
        if (courseOrder >= newOrder && courseOrder < currentOrder) {
          newOrderValue = courseOrder + 1
        } else {
          newOrderValue = courseOrder
        }
      }

      return {
        id: course.id,
        order: newOrderValue,
      }
    })

    // Update all courses with their new order values
    for (const course of updatedCourses) {
      const { error: updateError } = await (supabase as any)
        .from('courses')
        .update({ order: course.order })
        .eq('id', course.id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update course order' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering courses:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
