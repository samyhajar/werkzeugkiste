'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Award } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'

interface Certificate {
  user_id: string;
  module_id: string;
  issued_at: string | null;
  modules: {
    title: string;
    description: string | null;
  }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

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
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          user_id,
          module_id,
          issued_at,
          modules (
            title,
            description
          )
        `)
        .eq('user_id', user!.id)

      if (error) throw error
      setCertificates(data || [])
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (moduleId: string) => {
    // Implement download logic here
    console.log('Downloading certificate for module:', moduleId)
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
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Anmeldung erforderlich</h2>
          <p className="text-gray-500 mb-6">Bitte melden Sie sich an, um Ihre Zertifikate zu sehen.</p>
          <Button onClick={() => setShowLoginModal(true)}>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Zertifikate gefunden</h3>
            <p className="mt-1 text-sm text-gray-500">Schließen Sie Module ab, um Zertifikate zu erhalten.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <Card key={cert.module_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cert.modules.title}</span>
                    <Award className="w-6 h-6 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{cert.modules.description || ''}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Ausgestellt am: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(cert.module_id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Herunterladen
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