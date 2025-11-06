import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Course = Pick<Database['public']['Tables']['courses']['Row'], 'id' | 'title'>
type Quiz = { id: string; title: string; course_id: string | null; lesson_id: string | null }
type QuizAttempt = { quiz_id: string; passed: boolean | null; score_percent: number | null }

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

    const { moduleId } = await request.json()

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: 'moduleId is required' },
        { status: 400 }
      )
    }

    // 1. Get all courses for this module
    const { data: moduleCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('module_id', moduleId)

    const moduleCoursesData = (moduleCourses || []) as Course[]

    if (coursesError) {
      console.error('Error fetching module courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module courses' },
        { status: 500 }
      )
    }

    if (!moduleCoursesData || moduleCoursesData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No courses found for this module' },
        { status: 404 }
      )
    }

    // 2. Get all quizzes for all courses in this module
    const { data: allQuizzes, error: quizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('id, title, course_id, lesson_id')
      .in(
        'course_id',
        moduleCoursesData.map(c => c.id)
      )

    const allQuizzesData = (allQuizzes || []) as Quiz[]

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    if (!allQuizzesData || allQuizzesData.length === 0) {
      // No quizzes for this module, so quiz completion is not required
      return NextResponse.json({
        success: true,
        allQuizzesPassed: true,
        passedQuizzes: [],
        totalQuizzes: 0,
        message: 'No quizzes required for this module',
      })
    }

    // 3. Check if user has passed all quizzes
    const { data: quizAttempts, error: attemptsError } = await supabase
      .from('enhanced_quiz_attempts')
      .select('quiz_id, passed, score_percent')
      .eq('user_id', user.id)
      .in(
        'quiz_id',
        allQuizzesData.map(q => q.id)
      )

    const quizAttemptsData = (quizAttempts || []) as QuizAttempt[]

    if (attemptsError) {
      console.error('Error fetching quiz attempts:', attemptsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quiz attempts' },
        { status: 500 }
      )
    }

    // 4. Check which quizzes have been passed
    const passedQuizzes = []
    const failedQuizzes = []
    let allQuizzesPassed = true

    for (const quiz of allQuizzesData) {
      const attempt = quizAttemptsData.find(a => a.quiz_id === quiz.id)

      if (attempt && attempt.passed) {
        passedQuizzes.push({
          id: quiz.id,
          title: quiz.title,
          score: attempt.score_percent,
        })
      } else {
        failedQuizzes.push({
          id: quiz.id,
          title: quiz.title,
        })
        allQuizzesPassed = false
      }
    }

    return NextResponse.json({
      success: true,
      allQuizzesPassed,
      passedQuizzes,
      failedQuizzes,
      totalQuizzes: allQuizzesData.length,
      message: allQuizzesPassed
        ? 'All quizzes passed!'
        : `${passedQuizzes.length}/${allQuizzesData.length} quizzes passed`,
    })
  } catch (error) {
    console.error('Quiz completion check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
