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

    if (!userProfile || !module) {
      return NextResponse.json(
        { success: false, error: 'User or module not found' },
        { status: 404 }
      )
    }

    // 2) fetch background template
    const bgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/zertifikat-leer-3.jpg`
    const bgResponse = await fetch(bgUrl)

    if (!bgResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch background template' },
        { status: 500 }
      )
    }

    const bgBytes = await bgResponse.arrayBuffer()

    // 3) build PDF
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([842, 595]) // A4 landscape (842x595 points)

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

    // Draw name if showName is true
    if (showName) {
      const name = userProfile?.full_name ?? ''
      page.drawText(name, {
        x: 120,
        y: 340,
        size: 28,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
    }

    // Draw module title
    page.drawText(module.title, {
      x: 120,
      y: 300,
      size: 18,
      font: fontRegular,
      color: rgb(0, 0, 0),
    })

    // Draw date
    const date = new Date().toLocaleDateString('de-AT')
    page.drawText(date, {
      x: 120,
      y: 260,
      size: 14,
      font: fontRegular,
      color: rgb(0, 0, 0),
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
      show_name: showName,
      name_used: showName ? userProfile?.full_name : null,
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
