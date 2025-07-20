import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, description, hero_image, status } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Module title is required' },
        { status: 400 }
      )
    }

    // Update module
    const { data: module, error } = await supabase
      .from('modules')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        hero_image: hero_image?.trim() || null,
        status: status || 'draft',
        updated_at: new Date().toISOString(),
      })
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
    const { id } = await params
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete module (courses will remain due to warning given to user)
    const { error } = await supabase.from('modules').delete().eq('id', id)

    if (error) {
      console.error('Error deleting module:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete module' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    })
  } catch (error) {
    console.error('Delete module API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
