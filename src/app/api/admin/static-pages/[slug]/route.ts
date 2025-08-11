import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin')
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )

    const { data, error } = await supabase
      .from('static_pages')
      .select('*')
      .eq('slug', params.slug)
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, page: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin')
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )

    const body = await request.json()
    const { title, content_html, content_json } = body as {
      title?: string
      content_html?: string | null
      content_json?: unknown | null
    }

    const { data, error } = await supabase
      .from('static_pages')
      .upsert(
        {
          slug: params.slug,
          title: title ?? params.slug,
          content_html: content_html ?? null,
          content_json: (content_json as any) ?? null,
        },
        { onConflict: 'slug' }
      )
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, page: data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
