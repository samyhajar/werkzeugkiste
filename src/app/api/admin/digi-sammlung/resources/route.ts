import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const categoryId = request.nextUrl.searchParams.get('categoryId')
  const query = supabase
    .from('digi_resources')
    .select('*')
    .order('sort_order', { ascending: true })
  const { data, error } = categoryId
    ? await query.eq('category_id', categoryId)
    : await query
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, resources: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
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

  const body = await req.json()
  const { id, category_id, title, description, url, logo_url, sort_order } =
    body as any
  const payload = {
    id,
    category_id,
    title,
    description,
    url,
    logo_url,
    sort_order,
  }
  const { data, error } = await supabase
    .from('digi_resources')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, resource: data })
}
