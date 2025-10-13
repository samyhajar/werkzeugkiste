import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * TEMPORARY: Debug endpoint to analyze why a certificate wasn't issued.
 * Server-side only. Requires SUPABASE_SERVICE_ROLE_KEY.
 *
 * GET /api/admin/debug-certificate?userId=UUID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1) First four modules by order
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, order')
      .order('order', { ascending: true })
      .limit(4)

    if (modulesError) {
      return NextResponse.json(
        { success: false, error: modulesError.message },
        { status: 500 }
      )
    }

    const moduleIds = (modules || []).map(m => m.id)

    // 2) Courses for these modules
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, module_id, title')
      .in('module_id', moduleIds)

    if (coursesError) {
      return NextResponse.json(
        { success: false, error: coursesError.message },
        { status: 500 }
      )
    }

    const courseIds = (courses || []).map(c => c.id)

    // 3) Lessons and quizzes for these courses
    const [{ data: lessons }, { data: quizzes }] = await Promise.all([
      supabase
        .from('lessons')
        .select('id, course_id, title')
        .in('course_id', courseIds),
      supabase
        .from('enhanced_quizzes')
        .select('id, course_id, lesson_id, title')
        .in('course_id', courseIds),
    ])

    // 4) User completions
    const [{ data: lessonProgress }, { data: quizAttempts }] =
      await Promise.all([
        supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', userId)
          .in(
            'lesson_id',
            (lessons || []).map(l => l.id)
          ),
        supabase
          .from('enhanced_quiz_attempts')
          .select('quiz_id, passed')
          .eq('user_id', userId)
          .in(
            'quiz_id',
            (quizzes || []).map(q => q.id)
          ),
      ])

    // 5) Compute missing items per module
    const completedLessonIds = new Set(
      (lessonProgress || []).map(lp => lp.lesson_id)
    )
    const passedQuizIds = new Set(
      (quizAttempts || []).filter(a => a.passed).map(a => a.quiz_id)
    )

    const perModule = (modules || []).map(m => {
      const mCourses = (courses || []).filter(c => c.module_id === m.id)
      const mCourseIds = mCourses.map(c => c.id)
      const mLessons = (lessons || []).filter(l =>
        mCourseIds.includes(l.course_id as string)
      )
      const mQuizzes = (quizzes || []).filter(q =>
        mCourseIds.includes(q.course_id as string)
      )

      const missingLessons = mLessons.filter(l => !completedLessonIds.has(l.id))
      const missingQuizzes = mQuizzes.filter(q => !passedQuizIds.has(q.id))

      return {
        module: { id: m.id, title: m.title, order: m.order },
        totals: { lessons: mLessons.length, quizzes: mQuizzes.length },
        missing: {
          lessons: missingLessons.map(l => ({ id: l.id, title: l.title })),
          quizzes: missingQuizzes.map(q => ({ id: q.id, title: q.title })),
        },
        isComplete: missingLessons.length === 0 && missingQuizzes.length === 0,
      }
    })

    // 6) Certificates rows
    const { data: certs } = await supabase
      .from('certificates')
      .select('id, module_id, issued_at, pdf_url')
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      modules: perModule,
      certificates: certs || [],
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}





