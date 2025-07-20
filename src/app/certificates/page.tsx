'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Award, Download, Calendar, CheckCircle, FileText } from 'lucide-react'

interface Certificate {
  id: string
  courseName: string
  completedDate: string
  score: number
  status: 'completed' | 'in_progress'
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      // TODO: Implement real certificate fetching from database
      // For now, show empty state since we removed sample data
      setCertificates([])
      setError(null)
    } catch (err) {
      setError('Failed to load certificates')
      console.error('Error fetching certificates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = (certificateId: string) => {
    // TODO: Implement real certificate download
    alert('Certificate download will be implemented when certificates are earned.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#486681] text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-bold">Meine Zertifikate</h1>
            <p className="text-blue-100 mt-2">Ihre abgeschlossenen Kurse und Zertifikate</p>
          </div>
        </header>

        {/* Loading */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-gray-600">Zertifikate werden geladen...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const completedCertificates = certificates.filter(cert => cert.status === 'completed')
  const inProgressCourses = certificates.filter(cert => cert.status === 'in_progress')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#486681] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Meine Zertifikate</h1>
          <p className="text-blue-100 mt-2">Ihre abgeschlossenen Kurse und Zertifikate</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{completedCertificates.length}</div>
              <div className="text-sm text-gray-600">Zertifikate erhalten</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{inProgressCourses.length}</div>
              <div className="text-sm text-gray-600">Kurse in Bearbeitung</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {completedCertificates.length > 0
                  ? Math.round(completedCertificates.reduce((sum, cert) => sum + cert.score, 0) / completedCertificates.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Durchschnittliche Punktzahl</div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {completedCertificates.length === 0 && inProgressCourses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <FileText className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Noch keine Zertifikate
            </h3>
            <p className="text-gray-600 mb-6">
              Schließen Sie Kurse ab, um Ihre ersten Zertifikate zu erhalten.
            </p>
            <Link href="/">
              <Button className="bg-[#486681] hover:bg-[#3e5570]">
                Zu den Lernmodulen
              </Button>
            </Link>
          </div>
        )}

        {/* Completed Certificates */}
        {completedCertificates.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Meine Zertifikate</h2>
            <div className="grid gap-6">
              {completedCertificates.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {certificate.courseName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Abgeschlossen am {new Date(certificate.completedDate).toLocaleDateString('de-DE')}</span>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {certificate.score}% erreicht
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadCertificate(certificate.id)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Courses in Progress */}
        {inProgressCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kurse in Bearbeitung</h2>
            <div className="grid gap-6">
              {inProgressCourses.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {certificate.courseName}
                          </h3>
                          <div className="text-sm text-gray-500">
                            Kurs in Bearbeitung
                          </div>
                        </div>
                      </div>
                      <Link href="/">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          Fortsetzen
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}