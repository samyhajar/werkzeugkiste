import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function DELETE(request: NextRequest) {
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { elementType, elementId } = await request.json()

    if (!elementType || !elementId) {
      return NextResponse.json(
        { success: false, error: 'Element type and ID are required' },
        { status: 400 }
      )
    }

    switch (elementType) {
      case 'courses':
        // Delete course and all its children (lessons, quizzes)
        const { error: courseError } = await supabase
          .from('courses')
          .delete()
          .eq('id', elementId)

        if (courseError) {
          console.error('Error deleting course:', courseError)
          return NextResponse.json(
            { success: false, error: courseError.message },
            { status: 500 }
          )
        }
        break

      case 'lessons':
        const { error: lessonError } = await supabase
          .from('lessons')
          .delete()
          .eq('id', elementId)

        if (lessonError) {
          console.error('Error deleting lesson:', lessonError)
          return NextResponse.json(
            { success: false, error: lessonError.message },
            { status: 500 }
          )
        }
        break

      case 'quizzes':
        const { error: quizError } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', elementId)

        if (quizError) {
          console.error('Error deleting quiz:', quizError)
          return NextResponse.json(
            { success: false, error: quizError.message },
            { status: 500 }
          )
        }
        break

      case 'modules':
        // Delete module and all its children (courses, lessons, quizzes)
        const { error: moduleError } = await supabase
          .from('modules')
          .delete()
          .eq('id', elementId)

        if (moduleError) {
          console.error('Error deleting module:', moduleError)
          return NextResponse.json(
            { success: false, error: moduleError.message },
            { status: 500 }
          )
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid element type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete element API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
