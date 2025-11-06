import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Question = Database['public']['Tables']['quiz_questions']['Row'] & {
  quiz_answers?: Array<Database['public']['Tables']['quiz_answers']['Row']>
}
type Quiz = Database['public']['Tables']['enhanced_quizzes']['Row']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { answers, textAnswers = {} } = await request.json()
    console.log('[quiz:submit] incoming', {
      env_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      quiz_id: id,
      answers_keys: Object.keys(answers || {}),
      text_keys: Object.keys(textAnswers || {}),
      time: new Date().toISOString(),
    })
    const supabase = await createClient()

    // Get current user
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

    // Fetch quiz and questions to validate answers
    const { data: quiz, error: quizError } = await supabase
      .from('enhanced_quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Fetch questions with correct answers
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
      return NextResponse.json(
        { success: false, error: 'Failed to load quiz questions' },
        { status: 500 }
      )
    }

    // Calculate score
    let totalPoints = 0
    let earnedPoints = 0
    const questionResults: any[] = []

    const questionsList = (questions || []) as Question[]
    questionsList.forEach((question: Question) => {
      const correctAnswers =
        question.quiz_answers?.filter(a => a.is_correct) || []
      const studentAnswerIds = answers[question.id] || []
      const studentTextAnswer = textAnswers[question.id] || ''

      totalPoints += question.points || 1

      let isCorrect = false
      let studentAnswerData: any = studentAnswerIds
      let correctAnswerData: any = correctAnswers.map(a => a.id)

      if (question.type === 'free_text' || question.type === 'fill_blank') {
        // For text questions, check if there's a correct answer in quiz_answers
        if (correctAnswers.length > 0) {
          // Compare text answer with the first correct answer (case insensitive, trimmed)
          const expectedAnswer =
            correctAnswers[0].answer_html?.toLowerCase().trim() || ''
          const givenAnswer = studentTextAnswer.toLowerCase().trim()
          isCorrect = expectedAnswer === givenAnswer
        } else {
          // If no correct answer is defined, mark as correct if text is provided
          isCorrect = studentTextAnswer.trim().length > 0
        }
        studentAnswerData = studentTextAnswer
        correctAnswerData = correctAnswers.map(a => a.answer_html)
      } else if (question.type === 'multiple') {
        // For multiple choice, all correct answers must be selected and no incorrect ones
        const correctAnswerIds = correctAnswers.map(a => a.id)
        isCorrect =
          correctAnswerIds.length === studentAnswerIds.length &&
          correctAnswerIds.every(id => studentAnswerIds.includes(id))
      } else {
        // For single choice, check if selected answer is correct
        isCorrect = correctAnswers.some(a => studentAnswerIds.includes(a.id))
      }

      if (isCorrect) {
        earnedPoints += question.points || 1
      }

      questionResults.push({
        question_id: question.id,
        is_correct: isCorrect,
        student_answers: studentAnswerData,
        correct_answers: correctAnswerData,
        points: question.points || 1,
        earned_points: isCorrect ? question.points || 1 : 0,
      })
    })

    const scorePercentage =
      totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const quizData = quiz as Quiz | null
    const passed = scorePercentage >= (quizData?.pass_percent || 0)

    // Save quiz attempt
    const { data: attempt, error: attemptError } = await (supabase as any)
      .from('enhanced_quiz_attempts')
      .insert({
        quiz_id: id,
        user_id: user.id,
        finished_at: new Date().toISOString(),
        score_points: earnedPoints,
        score_percent: scorePercentage,
        passed: passed,
        raw_answers: { answers, textAnswers },
        meta: {
          total_questions: questions?.length || 0,
          answered_questions:
            Object.keys(answers).length +
            Object.keys(textAnswers).filter(id => textAnswers[id].trim() !== '')
              .length,
          question_results: questionResults,
        },
      })
      .select()
      .single()

    if (attemptError) {
      console.error('[quiz:submit] upsert error', attemptError)
      return NextResponse.json(
        { success: false, error: 'Failed to save quiz attempt' },
        { status: 500 }
      )
    }

    console.log('[quiz:submit] upsert ok', {
      user_id: user.id,
      quiz_id: id,
      attempt_id: attempt.id,
      passed,
      scorePercentage,
    })

    return NextResponse.json({
      success: true,
      results: {
        attempt_id: attempt.id,
        score_percentage: scorePercentage,
        earned_points: earnedPoints,
        total_points: totalPoints,
        passed: passed,
        question_results: questionResults,
        total_questions: questions?.length || 0,
        answered_questions:
          Object.keys(answers).length +
          Object.keys(textAnswers).filter(id => textAnswers[id].trim() !== '')
            .length,
      },
    })
  } catch (error) {
    console.error('Quiz submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
