'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { CardDescription } from '@/components/ui/card'
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
    void fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Loading students...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load students</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <Button
              onClick={() => void fetchStudents()}
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
    <div className="w-full px-8 py-8 space-y-8">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4 text-lg">
              {students.length === 0 ? 'No students registered yet' : 'No students match your search'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#486681] to-[#3e5570]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`
                      hover:bg-gray-50 transition-colors duration-200
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#486681] to-[#3e5570] flex items-center justify-center shadow-sm">
                            <span className="text-white font-medium text-sm">
                              {(student.full_name || student.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Student ID: {student.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="secondary"
                        className="bg-[#486681]/10 text-[#486681] border-[#486681]/20"
                      >
                        {student.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDistanceToNow(new Date(student.created_at), { addSuffix: true })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm"
                        >
                          Progress
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#486681] text-[#486681] hover:bg-[#486681]/10 shadow-sm"
                        >
                          Message
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {students.filter(s => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(s.created_at) > weekAgo
              }).length}
            </div>
            <p className="text-sm text-gray-500">This week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50/30">
          <CardHeader>
            <CardTitle className="text-base text-[#486681]">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
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