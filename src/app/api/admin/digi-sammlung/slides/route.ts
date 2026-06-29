import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import { resolveImageMetadataUpdate } from '@/lib/cloudinary-metadata.server'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const resourceId = request.nextUrl.searchParams.get('resourceId')
  const query = supabase
    .from('digi_resource_slides')
    .select('*')
    .order('sort_order', { ascending: true })
  const { data, error } = resourceId
    ? await query.eq('resource_id', resourceId)
    : await query
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, slides: data || [] })
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
    resource_id,
    title,
    body: slideBody,
    link_url,
    image_url,
    sort_order,
    deleted,
  } = body as any

  // Deletion
  if (deleted && id) {
    const { error } = await supabase
      .from('digi_resource_slides')
      .delete()
      .eq('id', id)
    if (error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    return NextResponse.json({ success: true })
  }

  const { data: existingSlide } = id
    ? await supabase
        .from('digi_resource_slides')
        .select('image_url, image_alt, image_public_id, image_width, image_height, image_format')
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  const previousSlideImage = existingSlide as any

  const imageMetadata = await resolveImageMetadataUpdate({
    prefix: 'image',
    imageUrl: image_url,
    previousImageUrl: previousSlideImage?.image_url,
    previousMetadata: previousSlideImage
      ? {
          alt: previousSlideImage.image_alt,
          publicId: previousSlideImage.image_public_id,
          width: previousSlideImage.image_width,
          height: previousSlideImage.image_height,
          format: previousSlideImage.image_format,
        }
      : undefined,
    fallbackAlt: title,
  })

  const payload = {
    id,
    resource_id,
    title,
    body: slideBody,
    link_url,
    image_url,
    sort_order,
    ...(imageMetadata as any),
  }
  const { data, error } = await (supabase
    .from('digi_resource_slides')
    .upsert(payload as any, { onConflict: 'id' })
    .select('*')
    .single() as any)
  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  return NextResponse.json({ success: true, slide: data })
}
