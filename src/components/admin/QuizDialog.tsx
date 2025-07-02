'use client'

import { FormEvent, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: { title: string; pass_pct: number }) => Promise<void>
}

export default function QuizDialog({ open, onOpenChange, onCreate }: QuizDialogProps) {
  const [title, setTitle] = useState('')
  const [passPct, setPassPct] = useState<number>(80)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onCreate({ title, pass_pct: passPct })
    setTitle('')
    setPassPct(80)
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Quiz</DialogTitle>
          <DialogDescription>Create a quiz for the selected lesson.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Title</Label>
            <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-pass">Pass Percentage</Label>
            <Input id="quiz-pass" type="number" min={0} max={100} value={passPct} onChange={(e) => setPassPct(Number(e.target.value))} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Quiz'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}