'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      } catch (err) {
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
    <div className="p-8">
      <div className="max-w-7xl space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="text-foreground/60">Manage issued certificates, search, and manually issue new ones.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/certificates/issue">Manual Issue</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Certificates</CardTitle>
            <CardDescription>Search by student, course, or ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search certificates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-96"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-foreground/60">Loading certificates...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-foreground/60">No certificates found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Course</th>
                      <th className="text-left p-2">Issued At</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cert) => (
                      <tr key={cert.student_id + cert.course_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{cert.student_name || cert.student_id}</div>
                          <div className="text-xs text-foreground/60">{cert.student_id}</div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{cert.course_title || cert.course_id}</div>
                          <div className="text-xs text-foreground/60">{cert.course_id}</div>
                        </td>
                        <td className="p-2">
                          {cert.issued_at ? format(new Date(cert.issued_at), 'yyyy-MM-dd') : <span className="text-foreground/40">Pending</span>}
                        </td>
                        <td className="p-2">
                          {cert.file_url ? (
                            <Badge variant="default">Issued</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {cert.file_url ? (
                            <a
                              href={cert.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-primary underline"
                            >
                              Download
                            </a>
                          ) : (
                            <span className="text-foreground/40">N/A</span>
                          )}
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