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

    // Fetch enhanced quizzes data with lesson and course information
    const { data: quizzes, error } = await supabase
      .from('enhanced_quizzes')
      .select(
        `
        *,
        course:courses(
          id,
          title
        ),
        lesson:lessons(
          id,
          title,
          course:courses(
            id,
            title
          )
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      quizzes: quizzes || [],
    })
  } catch (error) {
    console.error('Quizzes API error:', error)
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

    const {
      title,
      description,
      lesson_id,
      course_id,
      scope = 'lesson',
      questions,
      pass_percentage,
    } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Determine scope and set appropriate IDs
    let quizData: any = {
      title,
      description,
      pass_percent: pass_percentage || 80,
      feedback_mode: 'at_end',
      max_points: questions?.length || 0,
      sort_order: 0,
      settings: {},
    }

    if (scope === 'lesson' && lesson_id) {
      quizData.lesson_id = lesson_id
      quizData.scope = 'lesson'
    } else if (scope === 'course' && course_id) {
      quizData.course_id = course_id
      quizData.scope = 'course'
    } else {
      return NextResponse.json(
        { error: 'Invalid scope or missing lesson/course ID' },
        { status: 400 }
      )
    }

    // Create new enhanced quiz
    const { data: newQuiz, error } = await supabase
      .from('enhanced_quizzes')
      .insert(quizData)
      .select(
        `
        *,
        course:courses(
          id,
          title
        ),
        lesson:lessons(
          id,
          title,
          course:courses(
            id,
            title
          )
        )
      `
      )
      .single()

    if (error) {
      console.error('Error creating quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If questions are provided, create them
    if (questions && questions.length > 0) {
      const questionData = questions.map((q: any, index: number) => ({
        quiz_id: newQuiz.id,
        type:
          q.type === 'multiple_choice'
            ? 'multiple'
            : q.type === 'true_false'
              ? 'single'
              : 'free_text',
        question_html: q.question_text,
        explanation_html: q.explanation,
        points: 1,
        sort_order: index,
        meta: {},
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionData)

      if (questionsError) {
        console.error('Error creating questions:', questionsError)
        // Don't fail the entire request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
    })
  } catch (error) {
    console.error('Create quiz API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
