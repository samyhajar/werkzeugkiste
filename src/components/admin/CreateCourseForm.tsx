'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TablesInsert } from '@/types/supabase'

export default function CreateCourseForm() {
  const [mounted, setMounted] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    // Initialize Supabase client only in browser
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])

  // Don't render during SSR/build time
  if (!mounted || !supabase) {
    return <div>Loading...</div>
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !supabase) return

    setLoading(true)
    setError('')

    const payload: TablesInsert<'courses'> = {
      title,
      description,
      admin_id: user.id,
      hero_image: null,
    }

    const { data, error } = await supabase.from('courses').insert(payload).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // redirect to course builder
    router.push(`/admin/courses/${data.id}/builder`)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="course-title">Course Title</Label>
        <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-desc">Description</Label>
        <Textarea id="course-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Course'}
      </Button>
    </form>
  )
}