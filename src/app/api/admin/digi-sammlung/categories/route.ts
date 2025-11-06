import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('digi_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return NextResponse.json({ success: true, categories: data || [] })
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
  const { title, slug, sort_order, icon } = body as {
    title: string
    slug: string
    sort_order?: number
    icon?: string | null
  }
  const { data, error } = await (supabase
    .from('digi_categories')
    .upsert(
      { title, slug, sort_order: sort_order ?? 0, icon: icon ?? null } as any,
      { onConflict: 'slug' }
    )
    .select('*')
    .single() as any)
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, category: data })
}
