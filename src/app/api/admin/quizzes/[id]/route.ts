import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null

    if (!profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete quiz from enhanced_quizzes table (questions and answers will be cascade deleted)
    const { error } = await supabase
      .from('enhanced_quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    })
  } catch (error) {
    console.error('Delete quiz API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: quizId } = await params

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

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      scope,
      course_id,
      lesson_id,
      pass_percent,
      max_points,
      feedback_mode,
    } = body

    // Validate required fields
    if (!title || !scope) {
      return NextResponse.json(
        { success: false, error: 'Title and scope are required' },
        { status: 400 }
      )
    }

    // Validate assignment based on scope
    if (scope === 'course' && !course_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course assignment is required for course quizzes',
        },
        { status: 400 }
      )
    }

    if (scope === 'lesson' && !lesson_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lesson assignment is required for lesson quizzes',
        },
        { status: 400 }
      )
    }

    // Update the enhanced quiz
    const updateData: any = {
      title,
      description,
      scope,
      pass_percent: pass_percent || 80,
      max_points: max_points || 0,
      feedback_mode: feedback_mode || 'at_end',
      updated_at: new Date().toISOString(),
    }

    // Set assignment based on scope
    if (scope === 'course') {
      updateData.course_id = course_id
      updateData.lesson_id = null
    } else {
      updateData.lesson_id = lesson_id
      updateData.course_id = null
    }

    const { data: quiz, error } = await (supabase as any)
      .from('enhanced_quizzes')
      .update(updateData as any)
      .eq('id', quizId)
      .select()
      .single()

    if (error) {
      console.error('Error updating quiz:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quiz,
    })
  } catch (error) {
    console.error('Error in quiz update API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Check if user is admin using profiles table (more reliable)
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

    // Fetch enhanced quiz data with lesson and course information
    const { data: quiz, error } = await supabase
      .from('enhanced_quizzes')
      .select(
        `
        *,
        course:courses(id, title),
        lesson:lessons(id, title, course:courses(id, title))
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching quiz:', error)
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, quiz })
  } catch (error) {
    console.error('Error in quiz detail API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
