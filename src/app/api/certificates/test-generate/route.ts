import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Get first module for testing
    const { data: module } = await supabase
      .from('modules')
      .select('id, title')
      .limit(1)
      .single()

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'No modules found' },
        { status: 404 }
      )
    }

    // Test names
    const testNames = [
      'Max Mustermann',
      'Anna Schmidt',
      'Peter Müller',
      'Lisa Weber',
    ]

    const results = []

    // Generate 4 certificates with different names
    for (let i = 0; i < testNames.length; i++) {
      const testName = testNames[i]
      const userId = `test-user-${i + 1}`

      try {
        // 2) fetch background template using signed URL
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from('certificates')
            .createSignedUrl('templates/zertifikat-leer-3.jpg', 3600) // 1 hour

        if (signedUrlError || !signedUrlData?.signedUrl) {
          throw new Error('Failed to access template')
        }

        const bgResponse = await fetch(signedUrlData.signedUrl)

        if (!bgResponse.ok) {
          throw new Error('Failed to fetch background template')
        }

        const bgBytes = await bgResponse.arrayBuffer()

        // 3) build PDF
        const pdf = await PDFDocument.create()
        const page = pdf.addPage([595.28, 841.89]) // A4 portrait (595.28 x 841.89 points)

        // Embed the background image
        const bgImage = await pdf.embedJpg(bgBytes)
        page.drawImage(bgImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        })

        // Add dynamic text
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

        // Draw name
        page.drawText(testName, {
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
        page.drawText(module.title, {
          x: 150,
          y: 500,
          size: 16,
          font: fontBold,
          color: rgb(0, 0, 0),
        })

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

        // 4) upload to Supabase Storage
        const path = `certificates/test/${userId}/${module.id}.pdf`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(path, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }

        // 5) insert DB record
        const { error: insertError } = await supabase
          .from('certificates')
          .insert({
            student_id: userId,
            course_id: module.id,
            file_url: uploadData?.path,
            issued_at: new Date().toISOString(),
          })

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`)
        }

        results.push({
          name: testName,
          url: uploadData?.path,
          success: true,
        })
      } catch (error) {
        console.error(`Error generating certificate for ${testName}:`, error)
        results.push({
          name: testName,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Generated ${results.filter(r => r.success).length} certificates`,
    })
  } catch (error) {
    console.error('Certificate test generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
