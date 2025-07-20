'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient as createClient } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'

interface CertificateRow {
  student_id: string
  student_name: string | null
  course_id: string
  course_title: string | null
  issued_at: string | null
  file_url: string | null
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('student_id, issued_at, file_url, course_id, courses(title), profiles(full_name)')
          .order('issued_at', { ascending: false })

        if (error) throw error

        setCertificates(
          (data || []).map((row) => ({
            student_id: row.student_id,
            student_name: (row.profiles as any)?.full_name || null,
            course_id: row.course_id,
            course_title: (row.courses as any)?.title || null,
            issued_at: row.issued_at,
            file_url: row.file_url
          }))
        )
      } catch (_err) {
        setCertificates([])
      } finally {
        setLoading(false)
      }
    }
    fetchCertificates()
  }, [supabase])

  const filtered = certificates.filter((c) => {
    const s = search.toLowerCase()
    return (
      (c.student_name?.toLowerCase().includes(s) || '') ||
      (c.course_title?.toLowerCase().includes(s) || '') ||
      c.student_id.toLowerCase().includes(s) ||
      c.course_id.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-2">
            Manage issued certificates, search, and manually issue new ones
          </p>
        </div>
        <Button asChild className="bg-[#486682] hover:bg-[#3e5570] text-white shadow-sm">
          <Link href="/admin/certificates/issue">
            <span className="mr-2">📜</span>
            Manual Issue
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-[#486682]/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#486682]">Total Certificates</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
              <span className="text-white text-sm">📜</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
            <p className="text-xs text-gray-500 mt-1">All certificates issued</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Issued</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
              <span className="text-white text-sm">✅</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {certificates.filter(c => c.file_url).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Completed certificates</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
              <span className="text-white text-sm">⏳</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {certificates.filter(c => !c.file_url).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting generation</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Certificates Card */}
      <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center">
              <span className="text-white text-lg">🎓</span>
            </div>
            <div>
              <CardTitle className="text-xl text-[#486682]">All Certificates</CardTitle>
              <CardDescription className="text-sm">Search by student, course, or ID</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <Input
                placeholder="Search certificates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full md:w-96 border-[#486682]/20 focus:border-[#486682] focus:ring-[#486682]/20"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-white text-2xl">📜</span>
              </div>
              <div className="text-gray-600">Loading certificates...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📜</span>
              </div>
              <div className="text-gray-600 mb-2">
                {search ? 'No certificates match your search' : 'No certificates found'}
              </div>
              {search && (
                <p className="text-gray-500 text-sm">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((cert, index) => (
                <div
                  key={cert.student_id + cert.course_id}
                  className="p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Certificate Icon */}
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#486682] to-[#3e5570] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">{index + 1}</span>
                      </div>

                      {/* Certificate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {cert.student_name || cert.student_id}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {cert.student_id}</p>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {cert.file_url ? (
                              <Badge className="bg-[#486682] text-white">
                                <span className="mr-1">✅</span>
                                Issued
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                <span className="mr-1">⏳</span>
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Course</p>
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {cert.course_title || cert.course_id}
                            </p>
                            <p className="text-xs text-gray-400">{cert.course_id}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 mb-1">Issued Date</p>
                            <p className="font-medium text-sm text-gray-900">
                              {cert.issued_at
                                ? format(new Date(cert.issued_at), 'MMM dd, yyyy')
                                : <span className="text-amber-600">Pending</span>
                              }
                            </p>
                          </div>

                          <div className="flex items-end justify-end">
                            {cert.file_url ? (
                              <Button
                                size="sm"
                                asChild
                                className="bg-[#486682] hover:bg-[#3e5570] text-white"
                              >
                                <a
                                  href={cert.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="mr-1">📥</span>
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <Button size="sm" disabled variant="outline">
                                <span className="mr-1">⏳</span>
                                Processing
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}