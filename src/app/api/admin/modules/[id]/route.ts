import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type ModuleUpdate = Database['public']['Tables']['modules']['Update']

interface UpdateModuleRequest {
  title: string
  description?: string
  hero_image?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get module details
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Get courses for this module
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('module_id', id)
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Error fetching courses for module:', coursesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module,
      courses: courses || [],
    })
  } catch (error) {
    console.error('Admin module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = (await request.json()) as UpdateModuleRequest
    const { title, description, hero_image } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Module title is required' },
        { status: 400 }
      )
    }

    // Update module
    const updateData: ModuleUpdate = {
      title: title.trim(),
      description: description?.trim() || null,
      hero_image: hero_image?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: module, error } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating module:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update module' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      module,
    })
  } catch (error) {
    console.error('Update module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Use getUser() instead of getSession() for better security
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: moduleId } = await params

    // First, check if the module exists
    const { data: existingModule, error: fetchError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', moduleId)
      .single()

    if (fetchError || !existingModule) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    // Use the database function to safely delete the module with all cascade
    const { data: result, error: deleteError } = await supabase.rpc(
      'delete_module_with_cascade',
      { module_id: moduleId }
    )

    if (deleteError) {
      console.error('Error deleting module with cascade:', deleteError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete module and related content',
        },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete module' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Module and all associated content deleted successfully',
    })
  } catch (error) {
    console.error('Delete module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
