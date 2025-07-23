import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type LessonUpdate = Database['public']['Tables']['lessons']['Update']

interface UpdateLessonRequest {
  title: string
  content?: string
  course_id: string
  sort_order?: number
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as UpdateLessonRequest

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.course_id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Update the lesson
    const updateData: LessonUpdate = {
      title: body.title.trim(),
      content: body.content || null,
      course_id: body.course_id,
      sort_order: body.sort_order || 0,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedLesson, error: updateError } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lesson:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update lesson' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lesson: updatedLesson,
      message: 'Lesson updated successfully',
    })
  } catch (error) {
    console.error('Update lesson API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: lessonId } = await params

    // First, check if the lesson exists
    const { data: existingLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('id', lessonId)
      .single()

    if (fetchError || !existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Delete the lesson
    const { error: lessonDeleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)

    if (lessonDeleteError) {
      console.error('Error deleting lesson:', lessonDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete lesson' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    })
  } catch (error) {
    console.error('Delete lesson API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
