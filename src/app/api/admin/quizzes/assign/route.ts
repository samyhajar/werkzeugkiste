import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

interface AssignQuizRequest {
  elementId: string
  parentId: string
  scope: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { elementId, parentId, scope } = body

    if (!elementId || !parentId) {
      return NextResponse.json(
        { success: false, error: 'Missing elementId or parentId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Determine the parent type and update accordingly
    const updateData: any = {
      scope: scope,
    }

    if (scope === 'course') {
      updateData.course_id = parentId
      updateData.lesson_id = null
    } else if (scope === 'lesson') {
      updateData.lesson_id = parentId
      updateData.course_id = null
    }

    // Get the current sort order for the target scope
    let sortOrder = 1
    if (scope === 'course' || scope === 'lesson') {
      const { data: existingQuizzes } = await supabase
        .from('enhanced_quizzes')
        .select('sort_order')
        .eq(scope === 'course' ? 'course_id' : 'lesson_id', parentId)
        .order('sort_order', { ascending: false })
        .limit(1)

      if (existingQuizzes && existingQuizzes.length > 0) {
        sortOrder = (existingQuizzes[0].sort_order || 0) + 1
      }
    }

    updateData.sort_order = sortOrder

    // Update the enhanced quiz
    const { data: quiz, error } = await supabase
      .from('enhanced_quizzes')
      .update(updateData)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning quiz:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, quiz })
  } catch (error) {
    console.error('Error in assign quiz API:', error)
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

    const { quiz_id, course_id } = await request.json()

    if (!quiz_id || !course_id) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID and Course ID are required' },
        { status: 400 }
      )
    }

    // First, assign the quiz to the course
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
