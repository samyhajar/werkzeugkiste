import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type ModuleInsert = Database['public']['Tables']['modules']['Insert']
type Profile = Database['public']['Tables']['profiles']['Row']

interface CreateModuleRequest {
  title: string
  description?: string
  hero_image?: string
  presenter_materials_content?: string
  presenter_materials_urls?: { url: string; title: string }[]
}

const normalizePresenterMaterialUrls = (
  urls: CreateModuleRequest['presenter_materials_urls']
) =>
  (urls || [])
    .filter(
      item =>
        item &&
        typeof item.url === 'string' &&
        typeof item.title === 'string' &&
        item.url.trim() !== ''
    )
    .map(item => ({
      url: item.url.trim(),
      title: item.title.trim(),
    }))

export async function GET(_request: NextRequest) {
  try {
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

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch all modules. The admin editor needs the full row so hidden fields
    // are not blanked when an existing module is opened and saved.
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, modules: modules || [] })
  } catch (error) {
    console.error('Error in modules API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null

    if (!profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = (await request.json()) as CreateModuleRequest
    const {
      title,
      description,
      hero_image,
      presenter_materials_content,
      presenter_materials_urls,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Module title is required' },
        { status: 400 }
      )
    }

    // Create new module
    const moduleData: ModuleInsert = {
      title: title.trim(),
      description: description?.trim() || null,
      hero_image: hero_image?.trim() || null,
      presenter_materials_content: presenter_materials_content?.trim() || null,
      presenter_materials_urls:
        normalizePresenterMaterialUrls(presenter_materials_urls),
    }

    const { data: module, error } = await (supabase as any)
      .from('modules')
      .insert([moduleData as any])
      .select()
      .single()

    if (error) {
      console.error('Error creating module:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create module' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module,
    })
  } catch (error) {
    console.error('Create module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
