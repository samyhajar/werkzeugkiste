import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete quiz (questions and options will be cascade deleted)
    const { error } = await supabase.from('quizzes').delete().eq('id', id)

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
    const { id } = await params
    const body = await request.json()

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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update quiz data
    const { error } = await supabase
      .from('enhanced_quizzes')
      .update({
        title: body.title,
        description: body.description,
        scope: body.scope,
        course_id: body.course_id,
        lesson_id: body.lesson_id,
        pass_percent: body.pass_percent,
        max_points: body.max_points,
        feedback_mode: body.feedback_mode,
        sort_order: body.sort_order,
        settings: body.settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating quiz:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully',
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

    if (profileError || !profile || profile.role !== 'admin') {
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
