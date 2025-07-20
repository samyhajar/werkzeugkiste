'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Award, Download, Calendar, CheckCircle } from 'lucide-react'

interface Certificate {
  id: string
  courseName: string
  completedDate: string
  score: number
  status: 'completed' | 'in_progress'
}

// Sample certificates for demonstration
const sampleCertificates: Certificate[] = [
  {
    id: '1',
    courseName: 'Kurs 1: Digitalisierung Basis',
    completedDate: '2024-01-15',
    score: 85,
    status: 'completed'
  },
  {
    id: '2',
    courseName: 'Kurs 2: Smartphone Basis',
    completedDate: '2024-01-20',
    score: 92,
    status: 'completed'
  },
  {
    id: '3',
    courseName: 'Kurs 3: Computer Basis',
    completedDate: '',
    score: 0,
    status: 'in_progress'
  }
]

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading certificates
    setTimeout(() => {
      setCertificates(sampleCertificates)
      setLoading(false)
    }, 1000)
  }, [])

  const handleDownloadCertificate = (certificateId: string) => {
    // In a real implementation, this would generate and download a PDF certificate
    alert('Certificate download would start here. This is a demo version.')
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Zertifikate</h1>
              <p className="text-blue-100 mt-2">Ihre abgeschlossenen Kurse und Zertifikate</p>
            </div>
            <Button variant="outline" asChild className="text-white border-white hover:bg-white hover:text-[#486681]">
              <Link href="/modules">
                Zurück zu den Modulen
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Completed Certificates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Erhaltene Zertifikate</h2>

          {completedCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Noch keine Zertifikate</h3>
                <p className="text-gray-500 mb-6">
                  Schließen Sie Ihre ersten Kurse ab, um Zertifikate zu erhalten.
                </p>
                <Button asChild>
                  <Link href="/modules">
                    Kurse entdecken
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </section>

        {/* Courses in Progress */}
        {inProgressCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kurse in Bearbeitung</h2>
            <div className="grid gap-6">
              {inProgressCourses.map((course) => (
                <Card key={course.id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Schließen Sie diesen Kurs ab, um ein Zertifikat zu erhalten.
                          </p>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href="/modules">
                          Kurs fortsetzen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Über Ihre Zertifikate
          </h3>
          <div className="prose text-gray-600">
            <p className="mb-4">
              Ihre Zertifikate bestätigen, dass Sie erfolgreich an unseren digitalen Lernmodulen teilgenommen haben.
              Jedes Zertifikat enthält folgende Informationen:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Name des abgeschlossenen Kurses</li>
              <li>Datum der Fertigstellung</li>
              <li>Ihre erreichte Punktzahl</li>
              <li>Eindeutige Zertifikatsnummer zur Verifizierung</li>
            </ul>
            <p>
              Die Zertifikate können als PDF heruntergeladen und ausgedruckt werden.
              Sie sind digital signiert und können zur Vorlage bei Arbeitgebern oder Bildungseinrichtungen verwendet werden.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Award, Download, Calendar, CheckCircle } from 'lucide-react'

interface Certificate {
  id: string
  courseName: string
  completedDate: string
  score: number
  status: 'completed' | 'in_progress'
}

// Sample certificates for demonstration
const sampleCertificates: Certificate[] = [
  {
    id: '1',
    courseName: 'Kurs 1: Digitalisierung Basis',
    completedDate: '2024-01-15',
    score: 85,
    status: 'completed'
  },
  {
    id: '2',
    courseName: 'Kurs 2: Smartphone Basis',
    completedDate: '2024-01-20',
    score: 92,
    status: 'completed'
  },
  {
    id: '3',
    courseName: 'Kurs 3: Computer Basis',
    completedDate: '',
    score: 0,
    status: 'in_progress'
  }
]

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading certificates
    setTimeout(() => {
      setCertificates(sampleCertificates)
      setLoading(false)
    }, 1000)
  }, [])

  const handleDownloadCertificate = (certificateId: string) => {
    // In a real implementation, this would generate and download a PDF certificate
    alert('Certificate download would start here. This is a demo version.')
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Meine Zertifikate</h1>
              <p className="text-blue-100 mt-2">Ihre abgeschlossenen Kurse und Zertifikate</p>
            </div>
            <Button variant="outline" asChild className="text-white border-white hover:bg-white hover:text-[#486681]">
              <Link href="/modules">
                Zurück zu den Modulen
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {/* Completed Certificates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Erhaltene Zertifikate</h2>

          {completedCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Noch keine Zertifikate</h3>
                <p className="text-gray-500 mb-6">
                  Schließen Sie Ihre ersten Kurse ab, um Zertifikate zu erhalten.
                </p>
                <Button asChild>
                  <Link href="/modules">
                    Kurse entdecken
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </section>

        {/* Courses in Progress */}
        {inProgressCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kurse in Bearbeitung</h2>
            <div className="grid gap-6">
              {inProgressCourses.map((course) => (
                <Card key={course.id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Schließen Sie diesen Kurs ab, um ein Zertifikat zu erhalten.
                          </p>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href="/modules">
                          Kurs fortsetzen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Über Ihre Zertifikate
          </h3>
          <div className="prose text-gray-600">
            <p className="mb-4">
              Ihre Zertifikate bestätigen, dass Sie erfolgreich an unseren digitalen Lernmodulen teilgenommen haben.
              Jedes Zertifikat enthält folgende Informationen:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Name des abgeschlossenen Kurses</li>
              <li>Datum der Fertigstellung</li>
              <li>Ihre erreichte Punktzahl</li>
              <li>Eindeutige Zertifikatsnummer zur Verifizierung</li>
            </ul>
            <p>
              Die Zertifikate können als PDF heruntergeladen und ausgedruckt werden.
              Sie sind digital signiert und können zur Vorlage bei Arbeitgebern oder Bildungseinrichtungen verwendet werden.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}