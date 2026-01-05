import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { CERTIFICATE_TEMPLATE_VERSION } from '@/lib/certificates/template'
import type { Database } from '@/types/supabase'

type Module = Pick<Database['public']['Tables']['modules']['Row'], 'id' | 'title'>
type Course = Pick<Database['public']['Tables']['courses']['Row'], 'id' | 'title'>
type Lesson = Pick<Database['public']['Tables']['lessons']['Row'], 'id' | 'title'>
type LessonProgress = Pick<Database['public']['Tables']['lesson_progress']['Row'], 'lesson_id'>
type Quiz = { id: string; title: string; course_id: string | null; lesson_id: string | null }
type QuizAttempt = {
  quiz_id: string
  passed: boolean | null
  score_percent: number | null
  finished_at: string | null
  started_at: string | null
}
type ExistingCertificate = Pick<Database['public']['Tables']['certificates']['Row'], 'id' | 'pdf_url' | 'issued_at' | 'meta'>

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      )
    }

    const { moduleId } = await request.json()

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: 'moduleId is required' },
        { status: 400 },
      )
    }

    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', moduleId)
      .single()

    const moduleData = module as Module | null

    if (moduleError || !moduleData) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 },
      )
    }

    const { data: moduleCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('module_id', moduleId)

    const moduleCoursesData = (moduleCourses || []) as Course[]

    if (coursesError) {
      console.error('Error fetching module courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module courses' },
        { status: 500 },
      )
    }

    if (!moduleCoursesData || moduleCoursesData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No courses found for this module' },
        { status: 404 },
      )
    }

    let allLessonsCompleted = true
    let completedCourseCount = 0

    for (const course of moduleCoursesData) {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('course_id', course.id)
        .order('sort_order', { ascending: true })

      const lessonsData = (lessons || []) as Lesson[]

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch lessons' },
          { status: 500 },
        )
      }

      if (!lessonsData || lessonsData.length === 0) {
        completedCourseCount += 1
        continue
      }

      const { data: completedLessons, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .in(
          'lesson_id',
          lessonsData.map(lesson => lesson.id),
        )

      const completedLessonsData = (completedLessons || []) as LessonProgress[]

      if (progressError) {
        console.error('Error fetching lesson progress:', progressError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch lesson progress' },
          { status: 500 },
        )
      }

      const completedLessonIds = completedLessonsData.map(lesson => lesson.lesson_id) || []
      const allLessonsInCourse = lessonsData.every(lesson =>
        completedLessonIds.includes(lesson.id),
      )

      if (allLessonsInCourse) {
        completedCourseCount += 1
      } else {
        allLessonsCompleted = false
      }
    }

    const { data: allQuizzes, error: quizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('id, title, course_id, lesson_id')
      .in(
        'course_id',
        moduleCoursesData.map(course => course.id),
      )

    const allQuizzesData = (allQuizzes || []) as Quiz[]

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 },
      )
    }

    let allQuizzesPassed = true
    const passedQuizzes: Array<{ id: string; title: string; score?: number | null }> = []
    const failedQuizzes: Array<{ id: string; title: string }> = []

    if (allQuizzesData && allQuizzesData.length > 0) {
      const { data: quizAttempts, error: attemptsError } = await supabase
        .from('enhanced_quiz_attempts')
        .select('quiz_id, passed, score_percent, finished_at, started_at')
        .eq('user_id', user.id)
        .in(
          'quiz_id',
          allQuizzesData.map(quiz => quiz.id),
        )

      const quizAttemptsData = (quizAttempts || []) as QuizAttempt[]

      if (attemptsError) {
        console.error('Error fetching quiz attempts:', attemptsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch quiz attempts' },
          { status: 500 },
        )
      }

      const attemptsByQuizId = new Map<string, QuizAttempt[]>()
      for (const attempt of quizAttemptsData) {
        const list = attemptsByQuizId.get(attempt.quiz_id) ?? []
        list.push(attempt)
        attemptsByQuizId.set(attempt.quiz_id, list)
      }

      const toAttemptTime = (attempt: QuizAttempt) => {
        const raw = attempt.finished_at ?? attempt.started_at
        if (!raw) return 0
        const t = Date.parse(raw)
        return Number.isFinite(t) ? t : 0
      }

      const pickBestAttempt = (attempts: QuizAttempt[]) => {
        if (!attempts.length) return null

        const passedAttempts = attempts.filter(a => a.passed)
        const candidates = passedAttempts.length ? passedAttempts : attempts

        return candidates.reduce((best, current) =>
          toAttemptTime(current) > toAttemptTime(best) ? current : best,
        )
      }

      for (const quiz of allQuizzesData) {
        const attempts = attemptsByQuizId.get(quiz.id) ?? []
        const bestAttempt = pickBestAttempt(attempts)

        if (bestAttempt?.passed) {
          passedQuizzes.push({
            id: quiz.id,
            title: quiz.title,
            score: bestAttempt.score_percent,
          })
        } else {
          failedQuizzes.push({ id: quiz.id, title: quiz.title })
          allQuizzesPassed = false
        }
      }
    }

    const totalCourses = moduleCourses.length
    const totalQuizzes = allQuizzes?.length || 0

    if (!allLessonsCompleted || !allQuizzesPassed) {
      return NextResponse.json({
        success: false,
        message: 'Module not yet completed',
        completedCourses: completedCourseCount,
        totalCourses,
        lessonsCompleted: allLessonsCompleted,
        quizzesPassed: allQuizzesPassed,
        passedQuizzes,
        failedQuizzes,
        totalQuizzes,
      })
    }

    const { data: existingCertificate, error: existingError } = await supabase
      .from('certificates')
      .select('id, pdf_url, issued_at, meta')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle()

    const existingCertificateData = existingCertificate as ExistingCertificate | null

    if (existingError) {
      console.error('Error checking existing certificate:', existingError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify existing certificates' },
        { status: 500 },
      )
    }

    const existingCertificateNumber =
      existingCertificateData && typeof existingCertificateData === 'object' && 'meta' in existingCertificateData
        ? (existingCertificateData as { meta?: { certificateNumber?: string } }).meta?.certificateNumber ?? null
        : null

    if (existingCertificateData) {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? null

      let objectExists = false

      if (supabaseUrl && existingCertificateData.pdf_url) {
        try {
          const encodedPath = existingCertificateData.pdf_url
            .split('/')
            .map(encodeURIComponent)
            .join('/')
          const headResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/public/${encodedPath}`,
            { method: 'HEAD' },
          )
          objectExists = headResponse.ok
        } catch (storageCheckError) {
          console.warn('Failed to verify existing certificate object:', storageCheckError)
        }
      }

      if (objectExists) {
        // Check template version; regenerate if outdated or missing
        const metaObj =
          typeof existingCertificateData === 'object' && existingCertificateData?.meta && typeof existingCertificateData.meta === 'object'
            ? (existingCertificateData.meta as Record<string, unknown>)
            : null
        const templateVersion = metaObj?.templateVersion as string | null
        const templateLoaded = (metaObj?.templateLoaded as boolean | undefined) ?? false

        if (templateVersion === CERTIFICATE_TEMPLATE_VERSION && templateLoaded) {
          return NextResponse.json({
            success: true,
            message: 'Module completed! Certificate already exists.',
            certificatesGenerated: 0,
            lessonsCompleted: true,
            quizzesPassed: true,
            passedQuizzes,
            failedQuizzes,
            totalQuizzes,
            certificatePath: existingCertificateData.pdf_url,
            issuedAt: existingCertificateData.issued_at,
            certificateNumber: existingCertificateNumber,
          })
        }

        console.info('Outdated or invalid certificate detected; regenerating.', {
          userId: user.id,
          moduleId,
          existingVersion: templateVersion,
          expectedVersion: CERTIFICATE_TEMPLATE_VERSION,
          templateLoaded,
        })
      }

      console.warn('Existing certificate record found but file missing, regenerating.', {
        userId: user.id,
        moduleId,
        certificatePath: existingCertificateData.pdf_url,
      })
    }

    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'generate-certificate',
      {
        body: {
          userId: user.id,
          moduleId,
        },
      },
    )

    if (functionError || !functionData || !functionData.success) {
      console.error('Error generating certificate via edge function:', functionError || functionData)
      return NextResponse.json(
        { success: false, error: 'Failed to generate certificate' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: functionData.message || 'Module completed! Certificate generated.',
      certificatesGenerated: 1,
      lessonsCompleted: true,
      quizzesPassed: true,
      passedQuizzes,
      failedQuizzes,
      totalQuizzes,
      certificatePath: functionData.certificatePath,
      certificateNumber: functionData.certificateNumber,
      issuedAt: functionData.issuedAt ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Module completion check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
