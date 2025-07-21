import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

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

    // Delete quiz (questions and options will be cascade deleted)
    const { error } = await supabase.from('quizzes').delete().eq('id', id)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete quiz' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    })
  } catch (error) {
    console.error('Delete quiz API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
