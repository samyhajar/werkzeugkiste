'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Award, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Removed: import { toast } from 'sonner'

interface Certificate {
  user_id: string
  module_id: string
  issued_at: string | null
  module?: {
    title?: string
    description?: string | null
  }
  pdf_url?: string
  fileUrl?: string
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCertificates()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const supabase = getBrowserClient()
      // Fetch certificates only
      const { data: certs, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user!.id)
        .order('issued_at', { ascending: false })

      if (error) throw error
      if (!certs || certs.length === 0) {
        setCertificates([])
        setLoading(false)
        return
      }

      // Fetch course info for each certificate
      const moduleIds = certs.map((c: { module_id: string }) => c.module_id)
      const { data: modules, error: moduleError } = await supabase
        .from('modules')
        .select('id, title, description')
        .in('id', moduleIds)

      if (moduleError) throw moduleError

      // Map module info to certificates
      const certsWithModules = certs.map((cert: { module_id: string }) => ({
        ...cert,
        module:
          modules?.find(
            (module: { id: string }) => module.id === cert.module_id
          ) || {},
      }))
      console.table(
        certsWithModules.map(cert => ({
          moduleId: cert.module_id,
          moduleTitle: cert.module?.title,
          pdfUrl: cert.pdf_url,
          issuedAt: cert.issued_at,
        })),
        ['moduleId', 'moduleTitle', 'pdfUrl', 'issuedAt']
      )
      setCertificates(certsWithModules)
    } catch (error) {
      console.error('Error fetching certificates:', error)
      if (error && typeof error === 'object') {
        // If error is a Supabase error object, log its details
        if (typeof error === 'object' && error !== null && 'details' in error) {
          console.error('Supabase error details:', error.details)
        }
        if (typeof error === 'object' && error !== null && 'message' in error) {
          console.error('Supabase error message:', error.message)
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
          console.error('Supabase error code:', error.code)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (certificate: Certificate) => {
    try {
      setDownloadingId(certificate.module_id)
      const supabase = getBrowserClient()

      const storedPath = certificate.pdf_url ?? ''
      const fallbackPath = `${certificate.user_id}/${certificate.module_id}.pdf`

      const candidatePaths = Array.from(
        new Set(
          [
            storedPath.replace(/^certificates\//, ''),
            storedPath,
            fallbackPath,
            `certificates/${fallbackPath}`,
          ].filter(Boolean),
        ),
      )

      console.debug('Downloading certificate', {
        storedPath,
        fallbackPath,
        candidatePaths,
      })

      let signedUrl: string | undefined
      let lastError: unknown

      for (const path of candidatePaths) {
        try {
          const { data, error } = await supabase.storage
            .from('certificates')
            .createSignedUrl(path, 60 * 60)

          if (error || !data?.signedUrl) {
            lastError = error || new Error('Signed URL missing')
            continue
          }

          signedUrl = data.signedUrl
          break
        } catch (error) {
          lastError = error
        }
      }

      if (!signedUrl) {
        throw lastError || new Error('Signed URL missing')
      }

      const a = document.createElement('a')
      a.href = signedUrl
      a.download = `zertifikat-${certificate.module_id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (downloadError) {
      console.error('Failed to download certificate:', downloadError)
    } finally {
      setDownloadingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Zertifikate...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Anmeldung erforderlich
          </h2>
          <p className="text-gray-500 mb-6">
            Bitte melden Sie sich an, um Ihre Zertifikate zu sehen.
          </p>
          <Button
            onClick={() =>
              router.push(
                `/auth/login?redirect=${encodeURIComponent(window.location.href)}`
              )
            }
          >
            Jetzt anmelden
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Meine Zertifikate
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Keine Zertifikate gefunden
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Schließen Sie Module ab, um Zertifikate zu erhalten.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map(cert => (
              <Card key={cert.module_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cert.module?.title || 'Unbekanntes Modul'}</span>
                    <Award className="w-6 h-6 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {cert.module?.description || ''}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Ausgestellt am:{' '}
                      {cert.issued_at
                        ? new Date(cert.issued_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(cert)}
                      disabled={downloadingId === cert.module_id}
                    >
                      {downloadingId === cert.module_id ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-[#486681] rounded-full"></span>
                          Lädt...
                        </span>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Herunterladen
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
