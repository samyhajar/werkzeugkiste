import { createPublicClient } from '@/lib/supabase/public-client'
import { Tables } from '@/types/supabase'

type DigiCategory = Tables<'digi_categories'>
type DigiResource = Tables<'digi_resources'>
type DigiResourceSlide = Tables<'digi_resource_slides'>

export async function loadDigiSammlungContent(): Promise<{
  cats: DigiCategory[]
  res: DigiResource[]
}> {
  const supabase = createPublicClient()
  const [{ data: cats, error: catsError }, { data: res, error: resError }] =
    await Promise.all([
      supabase
        .from('digi_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('digi_resources')
        .select('*')
        .order('sort_order', { ascending: true }),
    ])

  if (catsError) {
    throw catsError
  }

  if (resError) {
    throw resError
  }

  return {
    cats: (cats || []) as DigiCategory[],
    res: (res || []) as DigiResource[],
  }
}

export async function loadDigiResourceSlides(
  resourceId: string
): Promise<DigiResourceSlide[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('digi_resource_slides')
    .select('*')
    .eq('resource_id', resourceId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []) as DigiResourceSlide[]
}
