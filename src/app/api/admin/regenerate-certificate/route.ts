import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    // Get module information
    const { data: module } = await supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .single()

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Generate PDF certificate
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595.28, 841.89]) // A4 portrait

    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)

    // Add text to the certificate
    page.drawText('ZERTIFIKAT', {
      x: 150,
      y: 700,
      size: 24,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    page.drawText('Digi+ Werkzeugkiste', {
      x: 150,
      y: 670,
      size: 16,
      font: fontRegular,
      color: rgb(0, 0, 0),
    })
    page.drawText('Hiermit wird bestätigt, dass', {
      x: 150,
      y: 600,
      size: 14,
      font: fontRegular,
      color: rgb(0, 0, 0),
    })

    const userName = userProfile?.full_name || 'Unbekannter Benutzer'
    page.drawText(userName, {
      x: 150,
      y: 570,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
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

    // Upload the generated certificate to storage
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

    // Update or insert certificate record
    const { error: upsertError } = await supabase.from('certificates').upsert(
      {
        user_id: userId,
        module_id: moduleId,
        pdf_url: certificatePath,
        issued_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,module_id',
      }
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

    console.log(
      `Certificate regenerated for user ${userId}, module ${moduleId}`
    )

    return NextResponse.json({
      success: true,
      message: 'Certificate regenerated successfully',
      certificatePath,
      uploadData,
    })
  } catch (error) {
    console.error('Certificate regeneration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
