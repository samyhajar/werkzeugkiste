import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type CertificateTemplateInsert =
  Database['public']['Tables']['certificate_templates']['Insert']

interface CreateTemplateRequest {
  name: string
  title: string
  subtitle?: string
  main_text?: string
  footer_text?: string
  show_date?: boolean
  show_certificate_number?: boolean
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch templates: ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/certificate-templates:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = (await request.json()) as CreateTemplateRequest

    const {
      name,
      title,
      subtitle,
      main_text,
      footer_text,
      show_date,
      show_certificate_number,
    } = body

    if (!name || !title) {
      return NextResponse.json(
        { success: false, error: 'Template name and title are required' },
        { status: 400 }
      )
    }

    const templateData: CertificateTemplateInsert = {
      name,
      title,
      subtitle: subtitle || '',
      main_text: main_text || '',
      footer_text: footer_text || '',
      show_date: show_date ?? true,
      show_certificate_number: show_certificate_number ?? true,
    }

    const { data: template, error } = await supabase
      .from('certificate_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create template: ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/certificate-templates:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
