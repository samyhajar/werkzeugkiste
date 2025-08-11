import { createClient } from '@/lib/supabase/server-client'
import { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

export type StaticPage = {
  id: string
  slug: string
  title: string
  content_html: string | null
  content_json: unknown | null
  meta: unknown | null
  created_at: string
  updated_at: string
}

type StaticPagesRow = Tables<'static_pages'>
type StaticPagesInsert = TablesInsert<'static_pages'>
type StaticPagesUpdate = TablesUpdate<'static_pages'>

export async function listStaticPages(): Promise<StaticPage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('static_pages')
    .select('*')
    .order('title', { ascending: true })

  if (error) {
    throw error
  }

  return (data as StaticPage[]) || []
}

export async function getStaticPageBySlug(
  slug: string
): Promise<StaticPage | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('static_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116: No rows returned
    throw error
  }

  return (data as StaticPage) || null
}

export async function upsertStaticPage(input: {
  slug: string
  title: string
  content_html?: string | null
  content_json?: unknown | null
  meta?: unknown | null
}): Promise<StaticPage> {
  const supabase = await createClient()

  const payload: StaticPagesInsert | StaticPagesUpdate = {
    slug: input.slug,
    title: input.title,
    content_html: input.content_html ?? null,
    content_json:
      (input.content_json as StaticPagesRow['content_json']) ?? null,
    meta: (input.meta as StaticPagesRow['meta']) ?? null,
  }

  const { data, error } = await supabase
    .from('static_pages')
    .upsert(payload, { onConflict: 'slug' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as StaticPage
}
