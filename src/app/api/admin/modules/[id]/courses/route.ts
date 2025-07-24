import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const moduleId = params.id

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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch courses assigned to this module
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('module_id', moduleId)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching module courses:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module courses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      courses: courses || [],
    })
  } catch (error) {
    console.error('Error in module courses API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
