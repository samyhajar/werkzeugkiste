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

    const { course_id, quiz_ids } = await request.json()

    if (!course_id || !quiz_ids || !Array.isArray(quiz_ids)) {
      return NextResponse.json(
        { success: false, error: 'Course ID and quiz IDs array are required' },
        { status: 400 }
      )
    }

    // Update the order of quizzes in the course
    for (let i = 0; i < quiz_ids.length; i++) {
      const { error } = await supabase
        .from('quizzes')
        .update({ order: i + 1 })
        .eq('id', quiz_ids[i])
        .eq('course_id', course_id)

      if (error) {
        console.error('Error updating quiz order:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Quizzes reordered successfully',
    })
  } catch (error) {
    console.error('Error in reorder quizzes API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
