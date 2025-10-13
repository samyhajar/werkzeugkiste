import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { CERTIFICATE_TEMPLATE_PATH, CERTIFICATE_TEMPLATE_VERSION } from './template'

interface GenerateCertificateOptions {
  supabase: SupabaseClient<Database>
  userId: string
  moduleId: string
  userName: string
  moduleTitle: string
  userEmail?: string
  templateOverridePath?: string
  issuedAt?: Date
  showName?: boolean
  displayDate?: boolean
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
  userEmail,
  templateOverridePath,
  issuedAt = new Date(),
  showName = true,
  displayDate = true,
}: GenerateCertificateOptions): Promise<GenerateCertificateResult> {
  const certificateNumber = `ZERT-${Date.now().toString().slice(-6)}`
  const formattedDate = issuedAt.toLocaleDateString('de-AT')
  const issuedAtIso = issuedAt.toISOString()
  
  // Try to load the new A4 PDF template from storage; fall back to public URL
  // Initialize with a blank A4 page to satisfy TS definite assignment.
  let pdf: PDFDocument = await PDFDocument.create()
  let page: PDFPage = pdf.addPage([595, 842])
  let templateSource: 'storage' | 'public-url' | 'fallback' = 'fallback'
  let templateLoaded = false

  const loadFromBytes = async (bytes: ArrayBuffer) => {
    try {
      const loaded = await PDFDocument.load(bytes)
      templateLoaded = true
      return loaded
    } catch (e) {
      console.warn('[certificates] Failed to parse template PDF bytes:', e)
      return null
    }
  }

  const resolvedTemplatePath = templateOverridePath || CERTIFICATE_TEMPLATE_PATH

  // Attempt 1: Supabase Storage SDK download
  try {
    const { data: templatePdfFile, error: templateDownloadError } = await supabase.storage
      .from('certificates')
      .download(resolvedTemplatePath)

    if (templateDownloadError) {
      console.warn('[certificates] Storage download failed:', templateDownloadError)
    }

    if (templatePdfFile) {
      const templateBytes = await templatePdfFile.arrayBuffer()
      const loaded = await loadFromBytes(templateBytes)
      if (loaded) {
        pdf = loaded
        page = pdf.getPage(0)
        templateSource = 'storage'
      }
    }
  } catch (e) {
    console.warn('[certificates] Exception during storage download:', e)
  }

  // Attempt 2: Public URL fetch
  if (!templateLoaded) {
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
      if (supabaseUrl) {
        const encodedPath = resolvedTemplatePath
          .split('/')
          .map(encodeURIComponent)
          .join('/')
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodedPath}`
        const resp = await fetch(publicUrl)
        if (resp.ok) {
          const templateBytes = await resp.arrayBuffer()
          const loaded = await loadFromBytes(templateBytes)
          if (loaded) {
            pdf = loaded
            page = pdf.getPage(0)
            templateSource = 'public-url'
          }
        } else {
          console.warn('[certificates] Public URL fetch failed:', publicUrl, resp.status)
        }
      }
    } catch (e) {
      console.warn('[certificates] Exception during public URL fetch:', e)
    }
  }

  // If neither storage nor public URL worked, we keep the initialized fallback.

  try {
    console.info('[certificates] Using template', {
      templatePath: resolvedTemplatePath,
      templateSource,
      templateLoaded,
    })
  } catch {}

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

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
  ) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
  }

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)

  // Overlay dynamic fields onto the template
  // - Email: under "Hiermit wird bestätigt"
  // - Module title: above "erfolgreich absolviert hat"
  // - Date: bottom-right, after "St Pölten, am"

  const pageHeight = page.getHeight()

  // Conservative initial positions for A4 (595x842). Tuned per feedback.
  // Keep module fixed where it was (~467 on A4), raise email, and move date up/right.
  const yModule = pageHeight - 375 // ~467 (unchanged)
  const yEmail = pageHeight - 290  // higher (~552)
  const yDate = 190               // higher from bottom

  if (userEmail) {
    drawCenteredText(userEmail, yEmail, 14, fontRegular)
  }

  if (moduleTitle) {
    drawCenteredText(moduleTitle, yModule, 18, fontBold)
  }

  // Place date near bottom-right. X chosen to sit after "St Pölten, am" in the template.
  if (displayDate) {
    const dateX = 470 // a bit more to the right
    drawText(formattedDate, dateX, yDate, 12, fontRegular)
  }

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
        userEmail: userEmail || null,
        templateVersion: CERTIFICATE_TEMPLATE_VERSION,
        templatePath: resolvedTemplatePath,
        templateSource,
        templateLoaded,
        displayDate,
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
