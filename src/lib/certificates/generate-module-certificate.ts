import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

interface GenerateCertificateOptions {
  supabase: SupabaseClient<Database>
  userId: string
  moduleId: string
  userName: string
  moduleTitle: string
  issuedAt?: Date
  showName?: boolean
}

interface GenerateCertificateResult {
  certificatePath: string
  certificateNumber: string
  issuedAt: string
}

export async function generateAndStoreModuleCertificate({
  supabase,
  userId,
  moduleId,
  userName,
  moduleTitle,
  issuedAt = new Date(),
  showName = true,
}: GenerateCertificateOptions): Promise<GenerateCertificateResult> {
  const certificateNumber = `ZERT-${Date.now().toString().slice(-6)}`
  const formattedDate = issuedAt.toLocaleDateString('de-AT')
  const issuedAtIso = issuedAt.toISOString()

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])

  const centerX = page.getWidth() / 2

  const drawCenteredText = (
    text: string,
    y: number,
    size: number,
    font: PDFFont,
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

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)

  const { data: templateData } = await supabase.storage
    .from('certificates')
    .download('templates/zertifikat-leer-3.jpg')

  if (templateData) {
    const templateBytes = await templateData.arrayBuffer()
    const jpgImage = await pdf.embedJpg(templateBytes)
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    })
  }

  drawCenteredText('ZERTIFIKAT', 700, 28, fontBold)
  drawCenteredText('Digi+ Werkzeugkiste', 670, 18, fontRegular)
  drawCenteredText('Hiermit wird bestätigt, dass', 620, 14, fontRegular)
  drawCenteredText(userName, 590, 22, fontBold)
  drawCenteredText('erfolgreich abgeschlossen hat.', 560, 14, fontRegular)
  drawCenteredText(`Modul: ${moduleTitle}`, 520, 16, fontBold)
  drawCenteredText(`Ausgestellt am: ${formattedDate}`, 500, 12, fontRegular)
  drawCenteredText(`Zertifikat-Nr.: ${certificateNumber}`, 480, 10, fontRegular)

  const pdfBytes = await pdf.save()

  const certificatePath = `certificates/${userId}/${moduleId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(certificatePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`)
  }

  const { error: upsertError } = await supabase.from('certificates').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      pdf_url: certificatePath,
      issued_at: issuedAtIso,
      name_used: showName ? userName : null,
      show_name: showName,
      meta: {
        certificateNumber,
      },
    },
    { onConflict: 'user_id,module_id' },
  )

  if (upsertError) {
    throw new Error(`Failed to save certificate record: ${upsertError.message}`)
  }

  return {
    certificatePath,
    certificateNumber,
    issuedAt: issuedAtIso,
  }
}
