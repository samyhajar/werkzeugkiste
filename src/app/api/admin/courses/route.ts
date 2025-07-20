import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      courses: courses || [],
    })
  } catch (error) {
    console.error('Admin courses API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { title, description, status } = await request.json()

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        status: status || 'draft',
        admin_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error('Admin create course API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

    if (error) {
      console.error('Error creating course:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      course,
    })
  } catch (error) {
    console.error('Admin create course API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
