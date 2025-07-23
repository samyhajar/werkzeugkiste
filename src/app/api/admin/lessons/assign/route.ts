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

    const { lesson_id, course_id } = await request.json()

    if (!lesson_id || !course_id) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID and Course ID are required' },
        { status: 400 }
      )
    }

    // Get the current maximum order for lessons in this course
    const { data: maxOrderResult, error: maxOrderError } = await supabase
      .from('lessons')
      .select('order')
      .eq('course_id', course_id)
      .not('order', 'is', null)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxOrderError) {
      console.error('Error getting max order:', maxOrderError)
      return NextResponse.json(
        { success: false, error: maxOrderError.message },
        { status: 500 }
      )
    }

    const newOrder = (maxOrderResult?.order || 0) + 1

    // Assign the lesson to the course with the new order
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({ course_id, order: newOrder })
      .eq('id', lesson_id)
      .select()
      .single()

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
