import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { answers, textAnswers = {} } = await request.json()
    const supabase = await createClient()

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

    questions?.forEach(question => {
      const correctAnswers = question.quiz_answers?.filter(a => a.is_correct)
      const studentAnswerIds = answers[question.id] || []
      const studentTextAnswer = textAnswers[question.id] || ''

      totalPoints += question.points || 1

      let isCorrect = false
      let studentAnswerData: any[] = []
      let correctAnswerData: any[] = []

      if (question.type === 'free_text' || question.type === 'fill_blank') {
        // For text questions, we'll mark as correct for now (could implement more sophisticated checking)
        isCorrect = studentTextAnswer.trim().length > 0
        studentAnswerData = [{ text: studentTextAnswer }]
        correctAnswerData =
          correctAnswers?.map(a => ({ text: a.answer_html })) || []
      } else {
        // For multiple choice questions
        const correctAnswerIds = correctAnswers?.map(a => a.id) || []

        // Check if student answers match correct answers
        if (question.type === 'multiple') {
          // For multiple choice, all correct answers must be selected and no incorrect ones
          isCorrect =
            correctAnswerIds.length === studentAnswerIds.length &&
            correctAnswerIds.every(id => studentAnswerIds.includes(id))
        } else {
          // For single choice, exactly one correct answer must be selected
          isCorrect =
            studentAnswerIds.length === 1 &&
            correctAnswerIds.includes(studentAnswerIds[0])
        }

        studentAnswerData = studentAnswerIds.map((id: string) => {
          const answer = question.quiz_answers?.find(a => a.id === id)
          return {
            id,
            text: answer?.answer_html || '',
            is_correct: answer?.is_correct || false,
          }
        })

        correctAnswerData =
          correctAnswers?.map(a => ({
            id: a.id,
            text: a.answer_html,
            is_correct: a.is_correct,
          })) || []
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
    const passed = scorePercentage >= (quiz.pass_percent || 0)

    // Return results without saving to database (guest mode)
    return NextResponse.json({
      success: true,
      results: {
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
        is_guest: true, // Flag to indicate this was a guest submission
        message:
          'Ergebnisse werden nicht gespeichert. Melden Sie sich an, um Ihren Fortschritt zu verfolgen.',
      },
    })
  } catch (error) {
    console.error('Guest quiz submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
