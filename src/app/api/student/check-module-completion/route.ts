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

    // 3. If all lessons are completed, generate certificates for each course
    if (allLessonsCompleted && completedCourses.length > 0) {
      // Get user profile for certificate generation
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Get module information
      const { data: module } = await supabase
        .from('modules')
        .select('title')
        .eq('id', moduleId)
        .single()

      // Get available certificate templates from storage
      const { data: templates, error: templatesError } = await supabase.storage
        .from('certificates')
        .list('templates', {
          limit: 100,
          offset: 0,
        })

      if (templatesError) {
        console.error('Error fetching templates:', templatesError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch certificate templates' },
          { status: 500 }
        )
      }

      // Use the first available template, or fallback to the default
      const templatePath =
        templates && templates.length > 0
          ? `templates/${templates[0].name}`
          : 'templates/zertifikat-leer-3.jpg'

      // Generate certificate for the completed module
      // Check if certificate already exists
      const { data: existingCertificate } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
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
        // Fetch the certificate template
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from('certificates')
            .createSignedUrl(templatePath, 3600)

        if (signedUrlError || !signedUrlData?.signedUrl) {
          console.error('Error accessing template:', signedUrlError)
          return NextResponse.json(
            { success: false, error: 'Failed to access certificate template' },
            { status: 500 }
          )
        }

        const templateResponse = await fetch(signedUrlData.signedUrl)
        if (!templateResponse.ok) {
          console.error('Error fetching template')
          return NextResponse.json(
            { success: false, error: 'Failed to fetch certificate template' },
            { status: 500 }
          )
        }

        const templateBytes = await templateResponse.arrayBuffer()

        // Generate PDF certificate
        const pdf = await PDFDocument.create()
        const page = pdf.addPage([595.28, 841.89]) // A4 portrait

        // Embed the background image
        const bgImage = await pdf.embedJpg(templateBytes)
        page.drawImage(bgImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        })

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
        const certificatePath = `certificates/${user.id}/${moduleId}.pdf`
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
            module_id: moduleId,
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
