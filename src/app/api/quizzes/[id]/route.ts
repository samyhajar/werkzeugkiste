import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user (for progress tracking and access control)
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

    // Fetch quiz details with related data from enhanced_quizzes table
    const { data: quiz, error: quizError } = await supabase
      .from('enhanced_quizzes')
      .select(
        `
        *,
        lessons(
          id,
          title,
          course_id,
          courses(
            id,
            title,
            status
          )
        )
      `
      )
      .eq('id', id)
      .single()

    if (quizError || !quiz) {
      console.error('Error fetching quiz:', quizError)
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Fetch quiz questions with answers
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(
        `
        *,
        quiz_answers(*)
      `
      )
      .eq('quiz_id', id)
      .order('sort_order', { ascending: true })

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to load quiz questions' },
        { status: 500 }
      )
    }

    // Check if course is published (unless user is admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Only allow access to published courses for non-admin users
    if (!isAdmin && (quiz.lessons as any)?.courses?.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Quiz not available' },
        { status: 403 }
      )
    }

    // Get user's quiz attempts if any
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const quizWithAttempts = {
      ...quiz,
      questions: questions || [],
      user_attempts: attempts || [],
      best_score:
        attempts && attempts.length > 0
          ? Math.max(...attempts.map(a => a.score_percentage || 0))
          : null,
      completed:
        attempts && attempts.length > 0
          ? attempts.some(a => a.passed === true)
          : false,
    }

    return NextResponse.json({
      success: true,
      quiz: quizWithAttempts,
    })
  } catch (error) {
    console.error('Quiz API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
