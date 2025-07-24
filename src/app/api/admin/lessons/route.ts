import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
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

    // Fetch lessons with course information
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(
        `
        id,
        title,
        content,
        course_id,
        "order",
        created_at,
        updated_at,
        course:courses(id, title)
      `
      )
      .order('"order"', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, lessons: lessons || [] })
  } catch (error) {
    console.error('Error in lessons API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin using profiles table (more reliable)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, content, course_id } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create new lesson
    const { data: newLesson, error } = await supabase
      .from('lessons')
      .insert([
        {
          title,
          content: content || null,
          course_id: course_id || null, // Allow null for unassigned lessons
          order: null, // Start with null order (unassigned)
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
