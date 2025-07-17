'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Course = Tables<'courses'>

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setCourses(data || [])
        }
      } catch (err) {
        setError('Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    void fetchCourses()
  }, [supabase])

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) {
        setError(error.message)
      } else {
        setCourses(courses.filter(course => course.id !== courseId))
      }
    } catch (err) {
      setError('Failed to delete course')
    }
  }

  const handleStatusToggle = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', courseId)

      if (error) {
        setError(error.message)
      } else {
        setCourses(courses.map(course =>
          course.id === courseId
            ? { ...course, status: newStatus }
            : course
        ))
      }
    } catch (err) {
      setError('Failed to update course status')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive text-lg mb-4">Error loading courses</p>
            <p className="text-foreground/60">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Courses</h2>
            <p className="text-foreground/60">
              Manage all courses and their content
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/courses/new">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Course
            </Link>
          </Button>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              {courses.length} course{courses.length === 1 ? '' : 's'} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">No courses yet</h3>
                <p className="text-foreground/60 mb-4">Get started by creating your first course</p>
                <Button asChild>
                  <Link href="/admin/courses/new">Create Course</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-foreground">Course</th>
                      <th className="text-left p-4 font-medium text-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-foreground">Created</th>
                      <th className="text-left p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <Link
                              href={`/admin/courses/${course.id}`}
                              className="text-brand-primary hover:underline font-medium"
                            >
                              {course.title}
                            </Link>
                            {course.description && (
                              <p className="text-sm text-foreground/60 mt-1">
                                {course.description.length > 100
                                  ? `${course.description.substring(0, 100)}...`
                                  : course.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                                                    <Badge
                            variant={course.status === 'published' ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => handleStatusToggle(course.id, course.status || 'draft')}
                          >
                            {course.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-foreground/60">
                          {course.created_at
                            ? formatDistanceToNow(new Date(course.created_at), { addSuffix: true })
                            : 'Unknown'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/courses/${course.id}`}>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/admin/courses/${course.id}/builder`}>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(course.id)}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}