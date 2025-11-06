import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

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
  const profileData = profile as Pick<Profile, 'role'> | null
  if (profileData?.role !== 'admin')
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )

  const body = await req.json()
  const {
    id,
    category_id,
    title,
    description,
    url,
    logo_url,
    sort_order,
    deleted,
  } = body as any

  // Handle deletion
  if (deleted && id) {
    // First delete all slides for this resource
    await supabase.from('digi_resource_slides').delete().eq('resource_id', id)

    // Then delete the resource
    const { error } = await supabase
      .from('digi_resources')
      .delete()
      .eq('id', id)
    if (error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    return NextResponse.json({ success: true })
  }

  const payload = {
    id,
    category_id,
    title,
    description,
    url,
    logo_url,
    sort_order,
  }
  const { data, error } = await (supabase
    .from('digi_resources')
    .upsert(payload as any, { onConflict: 'id' })
    .select('*')
    .single() as any)
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, resource: data })
}

export async function DELETE(req: NextRequest) {
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
  const profileData = profile as Pick<Profile, 'role'> | null
  if (profileData?.role !== 'admin')
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )

  const { searchParams } = new URL(req.url)
  const resourceId = searchParams.get('id')

  if (!resourceId) {
    return NextResponse.json(
      { success: false, error: 'Resource ID is required' },
      { status: 400 }
    )
  }

  // First delete all slides for this resource
  await supabase
    .from('digi_resource_slides')
    .delete()
    .eq('resource_id', resourceId)

  // Then delete the resource
  const { error } = await supabase
    .from('digi_resources')
    .delete()
    .eq('id', resourceId)

  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )

  return NextResponse.json({ success: true })
}
