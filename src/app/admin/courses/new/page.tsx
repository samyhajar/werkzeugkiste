'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'

// Dynamically import the CreateCourseForm to prevent SSR issues
const CreateCourseForm = dynamicImport(() => import('@/components/admin/CreateCourseForm'), {
  ssr: false,
  loading: () => <div>Loading form...</div>
})

export default function NewCoursePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/admin/courses">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Courses
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Create New Course</h2>
              <p className="text-foreground/60">
                Add a new course to your learning platform
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {mounted && <CreateCourseForm />}
      </div>
    </div>
  )
}