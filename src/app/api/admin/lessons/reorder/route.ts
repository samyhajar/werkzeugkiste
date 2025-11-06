import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Lesson = Pick<Database['public']['Tables']['lessons']['Row'], 'course_id' | 'order'>
type LessonOrder = Pick<Database['public']['Tables']['lessons']['Row'], 'id' | 'order'>

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
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

    // Check if user is admin
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

    const { lessonId, newOrder } = await request.json()

    if (!lessonId || typeof newOrder !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Get the current lesson to find its course_id
    const { data: currentLesson, error: currentError } = await supabase
      .from('lessons')
      .select('course_id, "order"')
      .eq('id', lessonId)
      .single()

    const currentLessonData = currentLesson as Lesson | null

    if (currentError || !currentLessonData) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const courseId = currentLessonData.course_id
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Lesson not assigned to a course' },
        { status: 400 }
      )
    }
    const currentOrder = currentLessonData.order || 0

    // Get all lessons in the same course
    const { data: courseLessons, error: courseError } = await supabase
      .from('lessons')
      .select('id, "order"')
      .eq('course_id', courseId)
      .order('"order"', { ascending: true })

    const courseLessonsData = (courseLessons || []) as LessonOrder[]

    if (courseError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch course lessons' },
        { status: 500 }
      )
    }

    // Calculate new order values
    const updatedLessons = courseLessonsData.map((lesson, index) => {
      let newOrderValue: number
      const lessonOrder = lesson.order || 0

      if (lesson.id === lessonId) {
        // This is the lesson being moved
        newOrderValue = newOrder
      } else if (currentOrder < newOrder) {
        // Moving down: shift lessons between current and new position up
        if (lessonOrder > currentOrder && lessonOrder <= newOrder) {
          newOrderValue = lessonOrder - 1
        } else {
          newOrderValue = lessonOrder
        }
      } else {
        // Moving up: shift lessons between new and current position down
        if (lessonOrder >= newOrder && lessonOrder < currentOrder) {
          newOrderValue = lessonOrder + 1
        } else {
          newOrderValue = lessonOrder
        }
      }

      return {
        id: lesson.id,
        order: newOrderValue,
      }
    })

    // Update all lessons with their new order values
    for (const lesson of updatedLessons) {
      const { error: updateError } = await (supabase as any)
        .from('lessons')
        .update({ order: lesson.order })
        .eq('id', lesson.id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update lesson order' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering lessons:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
