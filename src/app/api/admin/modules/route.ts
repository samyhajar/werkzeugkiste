import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all modules (both draft and published) for admin
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching modules for admin:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      modules: modules || [],
    })
  } catch (error) {
    console.error('Admin modules API error:', error)
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

    // Create new module
    const { data: module, error } = await supabase
      .from('modules')
      .insert([
        {
          title: title.trim(),
          description: description?.trim() || null,
          hero_image: hero_image?.trim() || null,
          status: status || 'draft',
        },
      ])
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
