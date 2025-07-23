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

    const { course_id, lesson_ids } = await request.json()

    if (!course_id || !lesson_ids || !Array.isArray(lesson_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID and lesson IDs array are required',
        },
        { status: 400 }
      )
    }

    // Get current orders of all lessons in the course
    const { data: currentLessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, sort_order')
      .eq('course_id', course_id)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      console.error('Error fetching current lessons:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    // Create a map of current orders
    const currentOrderMap = new Map()
    currentLessons?.forEach(lesson => {
      currentOrderMap.set(lesson.id, lesson.sort_order)
    })

    // Update orders incrementally
    for (let i = 0; i < lesson_ids.length; i++) {
      const lessonId = lesson_ids[i]
      const currentOrder = currentOrderMap.get(lessonId) || 0
      const newOrder = i + 1

      // Only update if order actually changed
      if (currentOrder !== newOrder) {
        const { error } = await supabase
          .from('lessons')
          .update({ sort_order: newOrder })
          .eq('id', lessonId)
          .eq('course_id', course_id)

        if (error) {
          console.error('Error updating lesson order:', error)
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lessons reordered successfully',
    })
  } catch (error) {
    console.error('Error in reorder lessons API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
