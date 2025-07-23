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

    const { quiz_id, course_id } = await request.json()

    console.log('Quiz assignment request:', { quiz_id, course_id })

    if (!quiz_id || !course_id) {
      console.log('Missing quiz_id or course_id')
      return NextResponse.json(
        { success: false, error: 'Quiz ID and Course ID are required' },
        { status: 400 }
      )
    }

    // First, assign the quiz to the course
    console.log(
      'Attempting to update enhanced_quizzes with quiz_id:',
      quiz_id,
      'course_id:',
      course_id
    )
    const { data: quiz, error } = await supabase
      .from('enhanced_quizzes')
      .update({ course_id } as any)
      .eq('id', quiz_id)
      .select()
      .single()

    if (error) {
      console.error('Error assigning quiz to course:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('Successfully assigned quiz:', quiz)

    // For now, skip the reordering to simplify debugging
    // TODO: Re-enable reordering once basic assignment works
    /*
    // Now update the order of all quizzes in this course using raw SQL
    const { error: reorderError } = await supabase.rpc(
      'reorder_quizzes_in_course',
      { course_id_param: course_id }
    )

    if (reorderError) {
      console.error('Error reordering quizzes in course:', reorderError)
      return NextResponse.json(
        { success: false, error: reorderError.message },
        { status: 500 }
      )
    }
    */

    return NextResponse.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error('Error in assign quiz API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
