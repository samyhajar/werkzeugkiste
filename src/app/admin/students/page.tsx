'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type Profile = Tables<'profiles'>

interface StudentWithProgress extends Profile {
  completed_lessons: number
  total_lessons: number
  certificates_earned: number
  last_activity: string | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)

        // Get all students
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false })

        if (studentsError) throw studentsError

        // Get progress data for each student
        const studentsWithProgress = await Promise.all(
          studentsData.map(async (student) => {
            // Get completed lessons count
            const { count: completedLessons } = await supabase
              .from('lesson_progress')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', student.id)

            // Get total lessons count
            const { count: totalLessons } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .in('course_id',
                (await supabase
                  .from('courses')
                  .select('id')
                  .eq('status', 'published')
                ).data?.map(course => course.id) || []
              )

            // Get certificates count
            const { count: certificatesEarned } = await supabase
              .from('certificates')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', student.id)

            // Get last activity
            const { data: lastActivity } = await supabase
              .from('lesson_progress')
              .select('completed_at')
              .eq('student_id', student.id)
              .order('completed_at', { ascending: false })
              .limit(1)

            return {
              ...student,
              completed_lessons: completedLessons || 0,
              total_lessons: totalLessons || 0,
              certificates_earned: certificatesEarned || 0,
              last_activity: lastActivity?.[0]?.completed_at || null
            }
          })
        )

        setStudents(studentsWithProgress)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    void fetchStudents()
  }, [supabase])

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleUpdate = async (studentId: string, newRole: 'student' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', studentId)

      if (error) throw error

      setStudents(students.map(student =>
        student.id === studentId
          ? { ...student, role: newRole }
          : student
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
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
            <p className="text-destructive text-lg mb-4">Error loading students</p>
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
            <h2 className="text-2xl font-bold text-foreground">Students</h2>
            <p className="text-foreground/60">
              Manage student accounts and track their progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {/* Students Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">{students.length}</div>
                <div className="text-sm text-foreground/60">Total Students</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {students.filter(s => s.last_activity).length}
                </div>
                <div className="text-sm text-foreground/60">Active Students</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {students.reduce((sum, s) => sum + s.certificates_earned, 0)}
                </div>
                <div className="text-sm text-foreground/60">Certificates Earned</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {students.length > 0
                    ? Math.round(students.reduce((sum, s) => sum + (s.completed_lessons / Math.max(s.total_lessons, 1)), 0) / students.length * 100)
                    : 0}%
                </div>
                <div className="text-sm text-foreground/60">Avg. Progress</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
            <CardDescription>
              {filteredStudents.length} of {students.length} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-foreground/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No students found' : 'No students yet'}
                </h3>
                <p className="text-foreground/60 mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once they register'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-foreground">Student</th>
                      <th className="text-left p-4 font-medium text-foreground">Progress</th>
                      <th className="text-left p-4 font-medium text-foreground">Certificates</th>
                      <th className="text-left p-4 font-medium text-foreground">Last Activity</th>
                      <th className="text-left p-4 font-medium text-foreground">Role</th>
                      <th className="text-left p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const progressPercentage = student.total_lessons > 0
                        ? Math.round((student.completed_lessons / student.total_lessons) * 100)
                        : 0

                      return (
                        <tr key={student.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-foreground">
                                {student.full_name || 'Unnamed Student'}
                              </div>
                              <div className="text-sm text-foreground/60">
                                {student.id}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className="bg-brand-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {progressPercentage}%
                              </span>
                            </div>
                            <div className="text-sm text-foreground/60 mt-1">
                              {student.completed_lessons} / {student.total_lessons} lessons
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-center">
                              <div className="text-lg font-medium text-foreground">
                                {student.certificates_earned}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-foreground/60">
                            {student.last_activity
                              ? formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })
                              : 'Never'}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={student.role === 'admin' ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => handleRoleUpdate(student.id, student.role === 'admin' ? 'student' : 'admin')}
                            >
                              {student.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/students/${student.id}`}>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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