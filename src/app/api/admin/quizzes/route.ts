import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch quizzes data with lesson and course information
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(
        `
        *,
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
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, lesson_id, questions, pass_percentage } =
      await request.json()

    if (!title || !lesson_id) {
      return NextResponse.json(
        { error: 'Title and lesson_id are required' },
        { status: 400 }
      )
    }

    // Create new quiz (simplified for now - just like CourseBuilder)
    const { data: newQuiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        lesson_id,
        pass_pct: pass_percentage || 80,
      } as any)
      .select(
        `
        *,
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
