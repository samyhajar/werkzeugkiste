'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Calendar, Activity } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { de } from 'date-fns/locale'

interface Student {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStudents(data.users || [])
          } else {
            setError(data.error || 'Failed to fetch students')
          }
        } else {
          setError('Failed to fetch students')
        }
      } catch (err) {
        setError('Failed to fetch students')
        console.error('Error fetching students:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchStudents()
  }, [])

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalStudents = students.length
  const recentStudents = students.filter(student => {
    if (!student.created_at) return false
    const createdDate = new Date(student.created_at)
    if (isNaN(createdDate.getTime())) return false
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate > weekAgo
  }).length
  const activeStudents = students.filter(student => {
    if (!student.created_at) return false
    const createdDate = new Date(student.created_at)
    if (isNaN(createdDate.getTime())) return false
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return createdDate > monthAgo
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#6e859a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-white mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-white text-[#486681] hover:bg-gray-100">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-8 py-8 space-y-8 bg-[#6e859a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Students</h1>
          <p className="text-white mt-2">
            Manage student accounts and progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[#486681]/10 text-[#486681] border-[#486681]/20">
            {filteredStudents.length} students
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{recentStudents}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-3xl font-bold text-gray-900">{activeStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 text-base border-gray-300 focus:border-[#486681] focus:ring-[#486681]/20 pl-10"
                />
              </div>
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="h-12 px-4"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4 text-lg">
              {students.length === 0 ? 'No students registered yet' : 'No students match your search'}
            </div>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                        {student.created_at && !isNaN(new Date(student.created_at).getTime())
                          ? formatDistance(new Date(student.created_at), new Date(), { locale: de })
                          : 'Unknown'
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.created_at && !isNaN(new Date(student.created_at).getTime())
                          ? new Date(student.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
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
        </div>
      )}
    </div>
  )
}