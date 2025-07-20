'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface Student {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchStudents = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/students', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStudents(data.students || [])
      } else {
        throw new Error(data.error || 'Failed to fetch students')
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486682] rounded-full animate-spin" />
            <span className="text-gray-600">Loading students...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load students</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => fetchStudents()}
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">
            Manage student accounts and progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredStudents.length} students
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {students.length === 0 ? 'No students registered yet' : 'No students match your search'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {student.full_name || 'No Name'}
                    </CardTitle>
                    <CardDescription>
                      {student.email}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {student.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    Joined {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-[#486682] hover:bg-[#3e5570] text-white">
                    View Progress
                  </Button>
                  <Button size="sm" variant="outline" className="border-[#486682] text-[#486682] hover:bg-[#486682]/10">
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(s.created_at) > weekAgo
              }).length}
            </div>
            <p className="text-sm text-gray-500">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                return new Date(s.updated_at || s.created_at) > monthAgo
              }).length}
            </div>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}