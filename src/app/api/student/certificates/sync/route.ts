import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { CERTIFICATE_TEMPLATE_VERSION } from '@/lib/certificates/template'

type Quiz = { id: string; title: string; course_id: string | null; lesson_id: string | null }

type QuizAttempt = {
  quiz_id: string
  passed: boolean | null
  score_percent: number | null
  finished_at: string | null
  started_at: string | null
}

type ExistingCertificate = {
  id: string
  pdf_url: string
  issued_at: string | null
  meta: unknown
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

export async function POST(_request: NextRequest) {
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

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title')
      .order('created_at', { ascending: true })

    if (modulesError) {
      console.error('certificates/sync: modules fetch failed', modulesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 },
      )
    }

    const moduleRows = (modules || []) as Array<{ id: string; title: string | null }>

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? null

    let checkedModules = 0
    let completedModules = 0
    let generated = 0
    let skippedExisting = 0
    let errors = 0

    for (const moduleRow of moduleRows) {
      checkedModules += 1

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('module_id', moduleRow.id)

      if (coursesError) {
        console.warn('certificates/sync: courses fetch failed', {
          moduleId: moduleRow.id,
          error: coursesError,
        })
        errors += 1
        continue
      }

      const courseRows = (courses || []) as Array<{ id: string }>
      const courseIds = courseRows.map(c => c.id)

      if (!courseIds.length) {
        continue
      }

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('course_id', courseIds)

      if (lessonsError) {
        console.warn('certificates/sync: lessons fetch failed', {
          moduleId: moduleRow.id,
          error: lessonsError,
        })
        errors += 1
        continue
      }

      const lessonRows = (lessons || []) as Array<{ id: string }>
      const lessonIds = lessonRows.map(l => l.id)

      let allLessonsCompleted = true
      if (lessonIds.length) {
        const { data: lessonProgress, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('student_id', user.id)
          .in('lesson_id', lessonIds)

        if (progressError) {
          console.warn('certificates/sync: lesson progress fetch failed', {
            moduleId: moduleRow.id,
            error: progressError,
          })
          errors += 1
          continue
        }

        const progressRows = (lessonProgress || []) as Array<{ lesson_id: string }>
        const completedLessonIds = new Set(progressRows.map(p => p.lesson_id))
        allLessonsCompleted = lessonIds.every(id => completedLessonIds.has(id))
      }

      // Fetch quizzes attached to courses and/or lessons.
      const quizzes: Quiz[] = []

      const { data: courseQuizzes, error: courseQuizError } = await supabase
        .from('enhanced_quizzes')
        .select('id, title, course_id, lesson_id')
        .in('course_id', courseIds)

      if (courseQuizError) {
        console.warn('certificates/sync: course quizzes fetch failed', {
          moduleId: moduleRow.id,
          error: courseQuizError,
        })
        errors += 1
        continue
      }

      quizzes.push(...((courseQuizzes || []) as Quiz[]))

      if (lessonIds.length) {
        const { data: lessonQuizzes, error: lessonQuizError } = await supabase
          .from('enhanced_quizzes')
          .select('id, title, course_id, lesson_id')
          .in('lesson_id', lessonIds)

        if (lessonQuizError) {
          console.warn('certificates/sync: lesson quizzes fetch failed', {
            moduleId: moduleRow.id,
            error: lessonQuizError,
          })
          errors += 1
          continue
        }

        quizzes.push(...((lessonQuizzes || []) as Quiz[]))
      }

      const quizById = new Map<string, Quiz>()
      for (const quiz of quizzes) {
        quizById.set(quiz.id, quiz)
      }

      const uniqueQuizzes = Array.from(quizById.values())

      let allQuizzesPassed = true
      if (uniqueQuizzes.length) {
        const quizIds = uniqueQuizzes.map(q => q.id)

        const { data: quizAttempts, error: attemptsError } = await supabase
          .from('enhanced_quiz_attempts')
          .select('quiz_id, passed, score_percent, finished_at, started_at')
          .eq('user_id', user.id)
          .in('quiz_id', quizIds)

        if (attemptsError) {
          console.warn('certificates/sync: quiz attempts fetch failed', {
            moduleId: moduleRow.id,
            error: attemptsError,
          })
          errors += 1
          continue
        }

        const attemptsByQuizId = new Map<string, QuizAttempt[]>()
        for (const attempt of (quizAttempts || []) as QuizAttempt[]) {
          const list = attemptsByQuizId.get(attempt.quiz_id) ?? []
          list.push(attempt)
          attemptsByQuizId.set(attempt.quiz_id, list)
        }

        for (const quiz of uniqueQuizzes) {
          const attempts = attemptsByQuizId.get(quiz.id) ?? []
          const bestAttempt = pickBestAttempt(attempts)
          if (!bestAttempt?.passed) {
            allQuizzesPassed = false
            break
          }
        }
      }

      if (!allLessonsCompleted || !allQuizzesPassed) {
        continue
      }

      completedModules += 1

      const { data: existingCertificate, error: existingError } = await supabase
        .from('certificates')
        .select('id, pdf_url, issued_at, meta')
        .eq('user_id', user.id)
        .eq('module_id', moduleRow.id)
        .maybeSingle()

      if (existingError) {
        console.warn('certificates/sync: existing certificate check failed', {
          moduleId: moduleRow.id,
          error: existingError,
        })
        errors += 1
        continue
      }

      const existingCertificateData = existingCertificate as ExistingCertificate | null

      let shouldGenerate = true
      if (existingCertificateData?.pdf_url) {
        // If the file exists and the template version is current, skip.
        let objectExists = false

        if (supabaseUrl) {
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
          } catch {
            // ignore; treat as missing
          }
        }

        if (objectExists) {
          const metaObj =
            typeof existingCertificateData.meta === 'object' && existingCertificateData.meta !== null
              ? (existingCertificateData.meta as Record<string, unknown>)
              : null

          const templateVersion = (metaObj?.templateVersion as string | null) ?? null
          const templateLoaded = (metaObj?.templateLoaded as boolean | undefined) ?? false

          if (templateVersion === CERTIFICATE_TEMPLATE_VERSION && templateLoaded) {
            shouldGenerate = false
          }
        }
      }

      if (!shouldGenerate) {
        skippedExisting += 1
        continue
      }

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-certificate',
        {
          body: {
            userId: user.id,
            moduleId: moduleRow.id,
          },
        },
      )

      if (functionError || !functionData || !functionData.success) {
        console.warn('certificates/sync: generation failed', {
          moduleId: moduleRow.id,
          error: functionError || functionData,
        })
        errors += 1
        continue
      }

      generated += 1
    }

    return NextResponse.json({
      success: true,
      checkedModules,
      completedModules,
      generated,
      skippedExisting,
      errors,
    })
  } catch (error) {
    console.error('certificates/sync: unexpected error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}
