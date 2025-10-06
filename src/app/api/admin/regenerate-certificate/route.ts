import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { userId, moduleId } = body

    if (!userId || !moduleId) {
      return NextResponse.json(
        { success: false, error: 'userId and moduleId are required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    // Ensure module exists (needed for FK constraint)
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Load JPG certificate template
    const { data: templateData, error: templateError } = await supabase.storage
      .from('certificates')
      .download('templates/zertifikat-leer-3.jpg')

    if (templateError || !templateData) {
      console.error('Template download error:', templateError)
      return NextResponse.json(
        { success: false, error: 'Failed to load certificate template.' },
        { status: 500 }
      )
    }

    const templateBytes = await templateData.arrayBuffer()

    // Create PDF
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842]) // A4 portrait

    // Embed JPG as background
    const jpgImage = await pdf.embedJpg(templateBytes)
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    })

    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
    const centerX = page.getWidth() / 2

    const drawCenteredText = (
      text: string,
      y: number,
      size: number,
      font: any
    ) => {
      const textWidth = font.widthOfTextAtSize(text, size)
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      })
    }

    // Certificate content
    drawCenteredText('ZERTIFIKAT', 700, 28, fontBold)
    drawCenteredText('Digi+ Werkzeugkiste', 670, 18, fontRegular)
    drawCenteredText('Hiermit wird bestätigt, dass', 620, 14, fontRegular)

    const userName = userProfile?.full_name || 'Unbekannter Benutzer'
    drawCenteredText(userName, 590, 22, fontBold)

    drawCenteredText('erfolgreich abgeschlossen hat.', 560, 14, fontRegular)

    // Date + certificate number
    const date = new Date().toLocaleDateString('de-AT')
    const certNumber = `ZERT-${Date.now().toString().slice(-6)}`
    drawCenteredText(`Ausgestellt am: ${date}`, 500, 12, fontRegular)
    drawCenteredText(`Zertifikat-Nr.: ${certNumber}`, 480, 10, fontRegular)

    const pdfBytes = await pdf.save()

    // Upload certificate to storage
    const certificatePath = `certificates/${userId}/${moduleId}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(certificatePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading certificate:', uploadError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload certificate: ${uploadError.message}`,
        },
        { status: 500 }
      )
    }

    // Save record (now with valid module_id)
    const { error: upsertError } = await supabase.from('certificates').upsert(
      {
        user_id: userId,
        module_id: moduleId, // required by FK + NOT NULL
        pdf_url: certificatePath,
        issued_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,module_id' }
    )

    if (upsertError) {
      console.error('Error saving certificate record:', upsertError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save certificate record: ${upsertError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate generated successfully',
      certificatePath,
      uploadData,
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
