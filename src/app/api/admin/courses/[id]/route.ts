import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

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

    const { id: courseId } = await params

    // First, check if the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (fetchError || !existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Delete all lessons in this course
    const { error: lessonsDeleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('course_id', courseId)

    if (lessonsDeleteError) {
      console.error('Error deleting lessons:', lessonsDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete lessons' },
        { status: 500 }
      )
    }

    // Delete all quizzes in this course
    const { error: quizzesDeleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('course_id', courseId)

    if (quizzesDeleteError) {
      console.error('Error deleting quizzes:', quizzesDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete quizzes' },
        { status: 500 }
      )
    }

    // Finally, delete the course
    const { error: courseDeleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (courseDeleteError) {
      console.error('Error deleting course:', courseDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Course and all associated content deleted successfully',
    })
  } catch (error) {
    console.error('Delete course API error:', error)
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
    const { id: courseId } = await params
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

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Update the course
    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update({
        title: body.title.trim(),
        description: body.description || null,
        module_id: body.module_id || null,
        hero_image: body.hero_image || null,
        status: body.status || 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating course:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: 'Course updated successfully',
    })
  } catch (error) {
    console.error('Update course API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
