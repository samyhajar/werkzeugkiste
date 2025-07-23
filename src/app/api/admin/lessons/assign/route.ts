import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface AssignLessonRequest {
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { elementId, parentId, scope } =
      (await request.json()) as AssignLessonRequest

    if (!elementId || !parentId) {
      return NextResponse.json(
        { success: false, error: 'Element ID and Parent ID are required' },
        { status: 400 }
      )
    }

    // Determine the parent type and update accordingly
    let updateData: any = {}

    if (scope === 'module') {
      // Assign to module (as a course)
      updateData.module_id = parentId
    } else if (scope === 'course') {
      // Assign to course
      updateData.course_id = parentId
    } else if (scope === 'lesson') {
      // Assign to lesson (as a quiz)
      updateData.lesson_id = parentId
    }

    // Get the current maximum order for lessons in this parent
    const { data: maxOrderResult, error: maxOrderError } = (await supabase
      .from('lessons')
      .select('sort_order')
      .eq(
        scope === 'module'
          ? 'module_id'
          : scope === 'course'
            ? 'course_id'
            : 'lesson_id',
        parentId
      )
      .not('sort_order', 'is', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: { sort_order: number } | null; error: any }

    if (maxOrderError) {
      console.error('Error getting max order:', maxOrderError)
      return NextResponse.json(
        { success: false, error: maxOrderError.message },
        { status: 500 }
      )
    }

    const newOrder = (maxOrderResult?.sort_order || 0) + 1
    updateData.sort_order = newOrder

    // Update the lesson to assign it to the parent
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning lesson:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson,
    })
  } catch (error) {
    console.error('Error in assign lesson API:', error)
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { lesson_id, course_id } = await request.json()

    if (!lesson_id || !course_id) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID and Course ID are required' },
        { status: 400 }
      )
    }

    // Get the current maximum order for lessons in this course
    const { data: maxOrderResult, error: maxOrderError } = (await supabase
      .from('lessons')
      .select('sort_order')
      .eq('course_id', course_id)
      .not('sort_order', 'is', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: { sort_order: number } | null; error: any }

    if (maxOrderError) {
      console.error('Error getting max order:', maxOrderError)
      return NextResponse.json(
        { success: false, error: maxOrderError.message },
        { status: 500 }
      )
    }

    const newOrder = (maxOrderResult?.sort_order || 0) + 1

    // Assign the lesson to the course with the new order
    const { data: lesson, error } = (await supabase
      .from('lessons')
      .update({ course_id, sort_order: newOrder })
      .eq('id', lesson_id)
      .select()
      .single()) as {
      data: {
        id: string
        title: string
        description?: string
        course_id: string
        sort_order: number
      } | null
      error: any
    }

    if (error) {
      console.error('Error assigning lesson to course:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson,
    })
  } catch (error) {
    console.error('Error in assign lesson API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
