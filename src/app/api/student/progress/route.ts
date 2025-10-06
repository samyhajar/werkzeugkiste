import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
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

    const { lesson_id } = await request.json()

    // Diagnostics: log who is writing progress and what
    console.log('[progress:POST] incoming', {
      env_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      lesson_id,
      time: new Date().toISOString(),
    })

    if (!lesson_id) {
      return NextResponse.json(
        { success: false, error: 'lesson_id is required' },
        { status: 400 }
      )
    }

    // Insert or update lesson progress with comprehensive tracking
    const { error } = await supabase.from('lesson_progress').upsert(
      {
        student_id: user.id,
        lesson_id: lesson_id,
        completed_at: new Date().toISOString(),
        last_viewed_at: new Date().toISOString(),
        progress_percent: 100, // Mark as fully completed when accessed
        xp_awarded: 10, // Award 10 XP for lesson completion
        reward_reason: 'Lesson accessed and completed',
      },
      {
        onConflict: 'student_id,lesson_id',
      }
    )

    if (error) {
      console.error('[progress:POST] upsert error', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    console.log('[progress:POST] upsert ok', {
      user_id: user.id,
      lesson_id,
    })

    return NextResponse.json({
      success: true,
      message: 'Lesson marked as complete',
    })
  } catch (error) {
    console.error('[progress:POST] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
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

    // Get user's progress
    const { data: progress, error } = await supabase
      .from('lesson_progress')
      .select(
        `
        lesson_id,
        completed_at,
        lessons!inner(
          id,
          title,
          course_id,
          courses!inner(
            id,
            title
          )
        )
      `
      )
      .eq('student_id', user.id)

    if (error) {
      console.error('Error fetching progress:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: progress || [],
    })
  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
