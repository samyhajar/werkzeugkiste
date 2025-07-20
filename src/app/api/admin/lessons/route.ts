import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch lessons data with course information
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(
        `
        *,
        course:courses(
          id,
          title
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lessons: lessons || [],
    })
  } catch (error) {
    console.error('Lessons API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, content, course_id, sort_order } = await request.json()

    if (!title || !course_id) {
      return NextResponse.json(
        { error: 'Title and course_id are required' },
        { status: 400 }
      )
    }

    // Create new lesson
    const { data: newLesson, error } = await supabase
      .from('lessons')
      .insert([
        {
          title,
          content: content || null,
          course_id,
          sort_order: sort_order || 0,
          admin_id: session.user.id,
        },
      ])
      .select(
        `
        *,
        course:courses(
          id,
          title
        )
      `
      )
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lesson: newLesson,
    })
  } catch (error) {
    console.error('Create lesson API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
