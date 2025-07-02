'use client'

import { useParams } from 'next/navigation'
import CourseBuilder from '@/components/admin/CourseBuilder'

/**
 * Course Builder Page
 * This page acts as a thin wrapper that extracts the `courseId` route param
 * and renders the interactive CourseBuilder client component.
 */
export default function CourseBuilderPage() {
  const params = useParams()
  const rawCourseId = (params as Record<string, string | string[] | undefined>).courseId
  const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId ?? ''

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Missing courseId in route.</p>
      </div>
    )
  }

  return <CourseBuilder courseId={courseId} />
}