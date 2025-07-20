'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function NewQuizPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [formData, setFormData] = useState({
    title: '',
    pass_pct: 80
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setCreating(true)
      setError('')

      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          lesson_id: lessonId,
          title: formData.title.trim(),
          pass_pct: formData.pass_pct
        } as any)
        .select()
        .single()

      if (error) throw error

      router.push(`/admin/courses/${courseId}/lessons/${lessonId}/quizzes/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/admin/courses/${courseId}/lessons/${lessonId}`}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Lesson
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create New Quiz</h2>
            <p className="text-foreground/60">
              Add a quiz to test student understanding
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Enter the basic information for your quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pass_pct">Pass Percentage</Label>
                <Input
                  id="pass_pct"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.pass_pct}
                  onChange={(e) => setFormData({ ...formData, pass_pct: parseInt(e.target.value) || 80 })}
                  placeholder="80"
                />
                <p className="text-sm text-foreground/60 mt-1">
                  Students need to score at least this percentage to pass the quiz
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Quiz'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/courses/${courseId}/lessons/${lessonId}`)}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}