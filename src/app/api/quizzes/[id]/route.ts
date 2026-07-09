import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Quiz = Database['public']['Tables']['enhanced_quizzes']['Row'] & {
  lessons?: Array<{
    id: string
    title: string
    course_id: string
    courses?: {
      id: string
      title: string
    }
  }>
}
type Question = Database['public']['Tables']['quiz_questions']['Row'] & {
  quiz_answers?: Array<Database['public']['Tables']['quiz_answers']['Row']>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user (optional for guest access, but good for progress tracking)
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
            title
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

    // TODO: Implement proper access control based on course/lesson status
    // For now, allow all authenticated users to access quizzes
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single()
    // const isAdmin = profile?.role === 'admin'

    // Get user's quiz attempts if any (only for authenticated users)
    let attempts: any[] = []
    if (user) {
      const { data: userAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      attempts = userAttempts || []
    }

    const quizData = quiz as Quiz | null
    const questionsList = (questions || []) as Question[]
    const quizWithAttempts = {
      ...(quizData || {}),
      questions: questionsList,
      user_attempts: attempts,
      best_score:
        attempts && attempts.length > 0
          ? Math.max(...attempts.map(a => a.score_percentage || 0))
          : null,
      completed:
        attempts && attempts.length > 0
          ? attempts.some(a => a.passed === true)
          : false,
      is_guest: !user, // Flag to indicate if this is a guest user
    }

    console.log('API: Quiz data being returned:', {
      quizId: id,
      questionsCount: questions?.length || 0,
      hasQuestions: !!questions && questions.length > 0,
    })

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
