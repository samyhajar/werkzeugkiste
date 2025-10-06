import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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

    // 0. Fetch all modules ordered by 'order' to determine the first four modules
    const { data: allModules, error: modulesError } = await supabase
      .from('modules')
      .select('id, order')
      .order('order', { ascending: true })

    if (modulesError || !allModules || allModules.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module list error or less than 4 modules exist',
        },
        { status: 500 }
      )
    }

    // Get the first four modules by order
    const firstFourModules = allModules.slice(0, 4)
    const firstFourModuleIds = firstFourModules.map(m => m.id)
    const isFirstFourModule = firstFourModuleIds.includes(moduleId)

    // 1. Get all courses for this module
    const { data: moduleCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('module_id', moduleId)

    if (coursesError) {
      console.error('Error fetching module courses:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module courses' },
        { status: 500 }
      )
    }

    if (!moduleCourses || moduleCourses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No courses found for this module' },
        { status: 404 }
      )
    }

    // 2. Check if user has completed all lessons for all courses in this module
    let allLessonsCompleted = true
    const completedCourses = []

    for (const course of moduleCourses) {
      // Get all lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('course_id', course.id)
        .order('sort_order', { ascending: true })

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
        continue
      }

      if (!lessons || lessons.length === 0) {
        continue
      }

      // Check if user has completed all lessons for this course
      const { data: completedLessons, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .in(
          'lesson_id',
          lessons.map(l => l.id)
        )

      if (progressError) {
        console.error('Error fetching lesson progress:', progressError)
        allLessonsCompleted = false
        break
      }

      const completedLessonIds = completedLessons?.map(l => l.lesson_id) || []
      const allLessonsInCourse = lessons.every(lesson =>
        completedLessonIds.includes(lesson.id)
      )

      if (allLessonsInCourse) {
        completedCourses.push(course)
      } else {
        allLessonsCompleted = false
      }
    }

    // 3. Check if user has passed all quizzes for this module
    const { data: allQuizzes, error: quizzesError } = await supabase
      .from('enhanced_quizzes')
      .select('id, title, course_id, lesson_id')
      .in(
        'course_id',
        moduleCourses.map(c => c.id)
      )

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quizzes' },
        { status: 500 }
      )
    }

    let allQuizzesPassed = true
    const passedQuizzes = []
    const failedQuizzes = []

    if (allQuizzes && allQuizzes.length > 0) {
      // Check if user has passed all quizzes
      const { data: quizAttempts, error: attemptsError } = await supabase
        .from('enhanced_quiz_attempts')
        .select('quiz_id, passed, score_percent')
        .eq('user_id', user.id)
        .in(
          'quiz_id',
          allQuizzes.map(q => q.id)
        )

      if (attemptsError) {
        console.error('Error fetching quiz attempts:', attemptsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch quiz attempts' },
          { status: 500 }
        )
      }

      // Check which quizzes have been passed
      for (const quiz of allQuizzes) {
        const attempt = quizAttempts?.find(a => a.quiz_id === quiz.id)

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
    } else {
      // No quizzes for this module, so quiz completion is not required
      allQuizzesPassed = true
    }

    // 4. If all lessons are completed AND all quizzes are passed, check all first four modules
    if (
      allLessonsCompleted &&
      allQuizzesPassed &&
      completedCourses.length > 0
    ) {
      // Only proceed if this is one of the first four modules
      if (!isFirstFourModule) {
        return NextResponse.json({
          success: true,
          message:
            'Module completed! Certificate is only issued after completing the first four modules.',
          certificatesGenerated: 0,
          lessonsCompleted: allLessonsCompleted,
          quizzesPassed: allQuizzesPassed,
          passedQuizzes,
          failedQuizzes,
          totalQuizzes: allQuizzes?.length || 0,
        })
      }

      // Check if user has completed all lessons and quizzes in ALL first four modules
      let allFirstFourModulesComplete = true
      for (const mod of firstFourModules) {
        // Get all courses for this module
        const { data: modCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('module_id', mod.id)
        if (!modCourses) {
          allFirstFourModulesComplete = false
          break
        }
        // Get all lessons for these courses
        const { data: modLessons } = await supabase
          .from('lessons')
          .select('id')
          .in(
            'course_id',
            modCourses.map(c => c.id)
          )
        // Get all quizzes for these courses
        const { data: modQuizzes } = await supabase
          .from('enhanced_quizzes')
          .select('id')
          .in(
            'course_id',
            modCourses.map(c => c.id)
          )
        // Check lesson completion — if no lessons exist, consider lessons requirement satisfied
        let allLessonsDone = true
        if (modLessons && modLessons.length > 0) {
          const { data: modCompletedLessons } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('student_id', user.id)
            .in(
              'lesson_id',
              modLessons.map(l => l.id)
            )
          allLessonsDone =
            !!modCompletedLessons &&
            modCompletedLessons.length === modLessons.length
        }
        // Check quiz completion — if no quizzes exist, consider quizzes requirement satisfied
        let allQuizzesDone = true
        if (modQuizzes && modQuizzes.length > 0) {
          const { data: modQuizAttempts } = await supabase
            .from('enhanced_quiz_attempts')
            .select('quiz_id, passed')
            .eq('user_id', user.id)
            .in(
              'quiz_id',
              modQuizzes.map(q => q.id)
            )
          for (const quiz of modQuizzes) {
            const attempt = modQuizAttempts?.find(a => a.quiz_id === quiz.id)
            if (!attempt || !attempt.passed) {
              allQuizzesDone = false
              break
            }
          }
        }
        if (!allLessonsDone || !allQuizzesDone) {
          allFirstFourModulesComplete = false
          break
        }
      }
      if (!allFirstFourModulesComplete) {
        return NextResponse.json({
          success: true,
          message:
            'Module completed! Certificate is only issued after completing all lessons and quizzes in the first four modules.',
          certificatesGenerated: 0,
          lessonsCompleted: allLessonsCompleted,
          quizzesPassed: allQuizzesPassed,
          passedQuizzes,
          failedQuizzes,
          totalQuizzes: allQuizzes?.length || 0,
        })
      }
      // Get user profile for certificate generation
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Program certificate: bind to the 4th module by order
      const programModuleId = firstFourModules[3].id
      const { data: module } = await supabase
        .from('modules')
        .select('title')
        .eq('id', programModuleId)
        .single()

      // Check if program certificate already exists (tied to 4th module)
      const { data: existingCertificate } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', programModuleId)
        .single()

      if (existingCertificate) {
        console.log(`Certificate already exists for module ${moduleId}`)
        return NextResponse.json({
          success: true,
          message: 'Module completed! Certificate already exists.',
          certificatesGenerated: 0,
        })
      }

      try {
        // Generate a simple PDF certificate without background image for now
        const pdf = await PDFDocument.create()
        const page = pdf.addPage([595.28, 841.89]) // A4 portrait

        // Add text to the certificate
        const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
        const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)

        // Certificate title
        page.drawText('ZERTIFIKAT', {
          x: 150,
          y: 700,
          size: 24,
          font: fontBold,
          color: rgb(0, 0, 0),
        })

        // Certificate subtitle
        page.drawText('Digi+ Werkzeugkiste', {
          x: 150,
          y: 670,
          size: 16,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })

        // This certifies that
        page.drawText('Hiermit wird bestätigt, dass', {
          x: 150,
          y: 600,
          size: 14,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })

        // Draw user name
        const userName = userProfile?.full_name || 'Unbekannter Benutzer'
        page.drawText(userName, {
          x: 150,
          y: 570,
          size: 20,
          font: fontBold,
          color: rgb(0, 0, 0),
        })

        // Successfully completed
        page.drawText('erfolgreich abgeschlossen hat:', {
          x: 150,
          y: 540,
          size: 14,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })

        // Module title
        if (module) {
          page.drawText(module.title, {
            x: 150,
            y: 500,
            size: 16,
            font: fontBold,
            color: rgb(0, 0, 0),
          })
        }

        // Date
        const date = new Date().toLocaleDateString('de-AT')
        page.drawText(`Ausgestellt am: ${date}`, {
          x: 150,
          y: 400,
          size: 12,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })

        // Certificate number
        const certNumber = `ZERT-${Date.now().toString().slice(-6)}`
        page.drawText(`Zertifikat-Nr.: ${certNumber}`, {
          x: 150,
          y: 380,
          size: 10,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })

        const pdfBytes = await pdf.save()

        // Upload the generated certificate to storage
        const certificatePath = `certificates/${user.id}/${programModuleId}.pdf`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(certificatePath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          })

        if (uploadError) {
          console.error('Error uploading certificate:', uploadError)
          return NextResponse.json(
            { success: false, error: 'Failed to upload certificate' },
            { status: 500 }
          )
        }

        // Save certificate record to database
        const { error: insertError } = await supabase
          .from('certificates')
          .insert({
            user_id: user.id,
            module_id: programModuleId,
            pdf_url: certificatePath,
            issued_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error saving certificate record:', insertError)
          return NextResponse.json(
            { success: false, error: 'Failed to save certificate record' },
            { status: 500 }
          )
        }

        console.log(`Certificate generated for module ${moduleId}`)

        return NextResponse.json({
          success: true,
          message: 'Module completed! Certificate generated.',
          certificatesGenerated: 1,
          lessonsCompleted: allLessonsCompleted,
          quizzesPassed: allQuizzesPassed,
          passedQuizzes,
          failedQuizzes,
          totalQuizzes: allQuizzes?.length || 0,
        })
      } catch (error) {
        console.error('Error generating certificate:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to generate certificate' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Module not yet completed',
        completedCourses: completedCourses.length,
        totalCourses: moduleCourses.length,
        lessonsCompleted: allLessonsCompleted,
        quizzesPassed: allQuizzesPassed,
        passedQuizzes,
        failedQuizzes,
        totalQuizzes: allQuizzes?.length || 0,
      })
    }
  } catch (error) {
    console.error('Module completion check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
