import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
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

    // Get quizzes for all courses from enhanced_quizzes table (status column was removed)
    const { data: quizzes, error } = await supabase
      .from('enhanced_quizzes')
      .select(
        `
        *,
        lessons!inner(
          course_id,
          courses!inner()
        )
      `
      )
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quizzes: quizzes || [],
    })
  } catch (error) {
    console.error('Student quizzes API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
