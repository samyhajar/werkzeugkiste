'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import LessonDialog from './LessonDialog'
import QuizDialog from './QuizDialog'

// Convenience type aliases
type Lesson = Tables<'lessons'>
type Quiz = Tables<'quizzes'>

interface LessonWithQuizzes extends Lesson {
  quizzes: Quiz[]
}

interface CourseBuilderProps {
  courseId: string
}

export default function CourseBuilder({ courseId }: CourseBuilderProps) {
  const supabase = useMemo(() => createClient(), [])

  const [lessons, setLessons] = useState<LessonWithQuizzes[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Dialog states
  const [lessonDialogOpen, setLessonDialogOpen] = useState<boolean>(false)
  const [quizDialogOpen, setQuizDialogOpen] = useState<{ open: boolean; lessonId: string | null }>({ open: false, lessonId: null })

  // Fetch lessons & quizzes on mount / refresh
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('lessons')
        .select('*, quizzes(*)')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setLessons(data as LessonWithQuizzes[])
      }
      setLoading(false)
    }

    void load()
  }, [courseId, supabase])

  // Helper: refresh list after mutation
  const refresh = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, quizzes(*)')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setLessons(data as LessonWithQuizzes[])
    }
  }

  // Create a new lesson via dialog callback
  const createLesson = async (payload: { title: string; markdown: string; video_url: string }) => {
    const nextOrder = lessons.length + 1
    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
      title: payload.title,
      markdown: payload.markdown,
      video_url: payload.video_url || null,
      sort_order: nextOrder,
    })

    if (error) {
      setError(error.message)
    } else {
      setLessonDialogOpen(false)
      await refresh()
    }
  }

  // Create a new quiz via dialog callback
  const createQuiz = async (payload: { title: string; pass_pct: number }) => {
    if (!quizDialogOpen.lessonId) return

    const { error } = await supabase.from('quizzes').insert({
      lesson_id: quizDialogOpen.lessonId,
      title: payload.title,
      pass_pct: payload.pass_pct,
    })

    if (error) {
      setError(error.message)
    } else {
      setQuizDialogOpen({ open: false, lessonId: null })
      await refresh()
    }
  }

  // Re-order lessons (move up / down)
  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const current = lessons[index]
    const target = lessons[targetIndex]

    // Swap sort_order locally
    const newCurrentOrder = target.sort_order
    const newTargetOrder = current.sort_order

    // Persist updates sequentially to satisfy TypeScript type requirements
    const { error: err1 } = await supabase
      .from('lessons')
      .update({ sort_order: newCurrentOrder })
      .eq('id', current.id)

    const { error: err2 } = await supabase
      .from('lessons')
      .update({ sort_order: newTargetOrder })
      .eq('id', target.id)

    if (err1 || err2) {
      setError(err1?.message ?? err2?.message ?? 'Reorder failed')
    } else {
      await refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Loading course builder...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href={`/admin/courses/${courseId}`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Course
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Course Builder</h2>
              <p className="text-foreground/60">
                Add and manage lessons and quizzes
              </p>
            </div>
          </div>
        </div>

      {/* Lesson Blocks */}
      {lessons.map((lesson, idx) => (
        <Card key={lesson.id} className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex-1">{lesson.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => void moveLesson(idx, 'up')}>↑</Button>
              <Button variant="ghost" size="sm" onClick={() => void moveLesson(idx, 'down')}>↓</Button>
              <Button variant="outline" size="sm" onClick={() => setQuizDialogOpen({ open: true, lessonId: lesson.id })}>Add Quiz</Button>
            </div>
          </CardHeader>
          {lesson.quizzes.length > 0 && (
            <CardContent>
              {lesson.quizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded p-4 my-2 bg-background">
                  <p className="font-medium">Quiz: {quiz.title}</p>
                  <p className="text-sm text-foreground/60">Pass %: {quiz.pass_pct}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}

        {/* Add Lesson Button */}
        <Button onClick={() => setLessonDialogOpen(true)}>Add Lesson</Button>

        {/* Lesson Dialog */}
        <LessonDialog
          open={lessonDialogOpen}
          onOpenChange={setLessonDialogOpen}
          onCreate={createLesson}
        />

        {/* Quiz Dialog */}
        <QuizDialog
          open={quizDialogOpen.open}
          onOpenChange={(open: boolean) => setQuizDialogOpen({ open, lessonId: quizDialogOpen.lessonId })}
          onCreate={createQuiz}
        />
      </div>
    </div>
  )
}