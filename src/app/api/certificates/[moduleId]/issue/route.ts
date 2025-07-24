import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { userId, showName = true } = await req.json()
    const { moduleId } = await params

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

    // 1) load user + module data
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const { data: module } = await supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .single()

    // Fetch courses for this module
    const { data: courses } = await supabase
      .from('courses')
      .select('title')
      .eq('module_id', moduleId)
      .order('order', { ascending: true })

    if (!userProfile || !module) {
      return NextResponse.json(
        { success: false, error: 'User or module not found' },
        { status: 404 }
      )
    }

    // 2) fetch background template using signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from('certificates')
        .createSignedUrl('templates/zertifikat-leer-3.jpg', 3600) // 1 hour

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { success: false, error: 'Failed to access template' },
        { status: 500 }
      )
    }

    const bgResponse = await fetch(signedUrlData.signedUrl)

    if (!bgResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch background template' },
        { status: 500 }
      )
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

    // Certificate title - large pink text, centered in the main content area
    const titleText = 'ZERTIFIKAT'
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 42)
    page.drawText(titleText, {
      x: (page.getWidth() - titleWidth) / 2,
      y: 500, // Lower position to avoid logo area
      size: 42,
      font: fontBold,
      color: rgb(0.8, 0.2, 0.6), // Pink color
    })

    // Module title - smaller pink text, centered below title
    const moduleText = module.title
    const moduleWidth = fontBold.widthOfTextAtSize(moduleText, 18)
    page.drawText(moduleText, {
      x: (page.getWidth() - moduleWidth) / 2,
      y: 460,
      size: 18,
      font: fontBold,
      color: rgb(0.8, 0.2, 0.6), // Pink color
    })

    // Date - black text, positioned on the right side
    const date = new Date().toLocaleDateString('de-AT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const dateWidth = fontRegular.widthOfTextAtSize(date, 12)
    page.drawText(date, {
      x: page.getWidth() - 80 - dateWidth,
      y: 460, // Same level as module title
      size: 12,
      font: fontRegular,
      color: rgb(0, 0, 0),
    })

    // Recipient name - blue text, positioned in the main content area
    if (showName) {
      const name = userProfile?.full_name ?? ''
      page.drawText(name, {
        x: 120, // Left margin to avoid blue shape
        y: 400,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0.8), // Blue color
      })
    }

    // Completion statement
    page.drawText('hat die folgenden Online-Kurse erfolgreich abgeschlossen:', {
      x: 120,
      y: 370,
      size: 12,
      font: fontRegular,
      color: rgb(0, 0, 0),
    })

    // List of courses with proper spacing in the main content area
    const coursesToDisplay = courses?.map(course => course.title) || []

    let yPosition = 330
    coursesToDisplay.forEach((course, _index) => {
      // Handle long course names by wrapping text
      const maxWidth = page.getWidth() - 240 // Leave margins to avoid blue shapes
      const words = course.split(' ')
      let currentLine = ''
      let lineY = yPosition

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const testWidth = fontRegular.widthOfTextAtSize(testLine, 10)

        if (testWidth > maxWidth && currentLine) {
          // Draw current line and start new line
          page.drawText(`+ ${currentLine}`, {
            x: 140,
            y: lineY,
            size: 10,
            font: fontRegular,
            color: rgb(0, 0, 0),
          })
          currentLine = word
          lineY -= 16
        } else {
          currentLine = testLine
        }
      })

      // Draw the last line
      if (currentLine) {
        page.drawText(`+ ${currentLine}`, {
          x: 140,
          y: lineY,
          size: 10,
          font: fontRegular,
          color: rgb(0, 0, 0),
        })
      }

      yPosition = lineY - 24 // More spacing between courses
    })

    // Certificate number at bottom, above the footer area
    const certNumber = `ZERT-${Date.now().toString().slice(-6)}`
    page.drawText(`Zertifikat-Nr.: ${certNumber}`, {
      x: 120,
      y: 200, // Above the blue footer area
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    })

    const pdfBytes = await pdf.save()

    // 4) upload to Supabase Storage
    const path = `certificates/${userId}/${moduleId}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(path, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload certificate' },
        { status: 500 }
      )
    }

    // 5) insert DB record
    const { error: insertError } = await supabase.from('certificates').insert({
      user_id: userId,
      module_id: moduleId,
      pdf_url: uploadData?.path,
      issued_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save certificate record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: uploadData?.path,
      certificateId: uploadData?.path,
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
