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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Fetch questions for this quiz
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('sort_order', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch questions' },
        { status: 500 }
      )
    }

    // Fetch answers for all questions
    const questionIds = questions?.map(q => q.id) || []
    let answers: any[] = []

    if (questionIds.length > 0) {
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('question_id', questionIds)
        .order('sort_order', { ascending: true })

      if (answersError) {
        console.error('Error fetching answers:', answersError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch answers' },
          { status: 500 }
        )
      }

      answers = answersData || []
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
      answers: answers,
    })
  } catch (error) {
    console.error('Error in quiz questions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
