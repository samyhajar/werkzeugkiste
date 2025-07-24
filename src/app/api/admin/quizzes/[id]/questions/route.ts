import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

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

    // Insert question
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: id,
        type: body.question.type,
        question_html: body.question.question_html,
        points: body.question.points,
        sort_order: body.question.sort_order,
        category: body.question.category,
        explanation_html: body.question.explanation_html,
        meta: body.question.meta || {},
      })
      .select()
      .single()

    if (questionError) {
      console.error('Error creating question:', questionError)
      return NextResponse.json(
        { success: false, error: 'Failed to create question' },
        { status: 500 }
      )
    }

    // Insert answers if provided
    if (body.answers && body.answers.length > 0) {
      const answersToInsert = body.answers.map((answer: any) => ({
        question_id: question.id,
        answer_html: answer.answer_html,
        is_correct: answer.is_correct,
        sort_order: answer.sort_order,
        feedback_html: answer.feedback_html,
        value_numeric: answer.value_numeric,
        value_text: answer.value_text,
        meta: answer.meta || {},
      }))

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersToInsert)

      if (answersError) {
        console.error('Error creating answers:', answersError)
        return NextResponse.json(
          { success: false, error: 'Failed to create answers' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, question })
  } catch (error) {
    console.error('Error in add question API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const quizId = params.id

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

    // Check if user is admin using profiles table
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

    // Fetch questions for this quiz
    const { data: questions, error } = await supabase
      .from('questions')
      .select(
        `
        *,
        options:options(*)
      `
      )
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching quiz questions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quiz questions' },
        { status: 500 }
      )
    }

    // Format questions to match the expected structure
    const formattedQuestions =
      questions?.map(q => ({
        id: q.id,
        type: q.type === 'single' ? 'multiple_choice' : q.type,
        question_text: q.question || '',
        explanation: '',
        sort_order: 0,
        options:
          q.options?.map(o => ({
            id: o.id,
            text: o.option_text || '',
            is_correct: o.is_correct || false,
          })) || [],
      })) || []

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
    })
  } catch (error) {
    console.error('Error in quiz questions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const quizId = params.id

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

    // Check if user is admin using profiles table
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

    // Parse request body
    const body = await request.json()
    const { questions } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'Questions array is required' },
        { status: 400 }
      )
    }

    // Delete existing questions for this quiz
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId)

    if (deleteError) {
      console.error('Error deleting existing questions:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to update questions' },
        { status: 500 }
      )
    }

    // Insert new questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          type: question.type === 'multiple_choice' ? 'single' : question.type,
          question: question.question_text,
        })
        .select()
        .single()

      if (questionError) {
        console.error('Error inserting question:', questionError)
        return NextResponse.json(
          { success: false, error: 'Failed to insert question' },
          { status: 500 }
        )
      }

      // Insert options for multiple choice and true/false questions
      if (question.options && question.options.length > 0) {
        const optionsToInsert = question.options.map(
          (option: any, optionIndex: number) => ({
            question_id: questionData.id,
            option_text: option.text,
            is_correct: option.is_correct,
          })
        )

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsToInsert)

        if (optionsError) {
          console.error('Error inserting options:', optionsError)
          return NextResponse.json(
            { success: false, error: 'Failed to insert options' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Questions updated successfully',
    })
  } catch (error) {
    console.error('Error in quiz questions update API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
