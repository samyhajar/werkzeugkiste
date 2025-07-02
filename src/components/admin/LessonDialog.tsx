'use client'

import { FormEvent, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface LessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: { title: string; markdown: string; video_url: string }) => Promise<void>
}

export default function LessonDialog({ open, onOpenChange, onCreate }: LessonDialogProps) {
  const [title, setTitle] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onCreate({ title, markdown, video_url: videoUrl })
    setTitle('')
    setMarkdown('')
    setVideoUrl('')
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lesson</DialogTitle>
          <DialogDescription>Provide details for the lesson.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-markdown">Content (Markdown)</Label>
            <Textarea id="lesson-markdown" value={markdown} onChange={(e) => setMarkdown(e.target.value)} rows={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-video">Video URL (optional)</Label>
            <Input id="lesson-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Lesson'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}