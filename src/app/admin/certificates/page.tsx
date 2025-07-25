'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatDateSafely } from '@/lib/utils'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

interface Certificate {
  id: string
  user_id: string
  module_id: string
  issued_at: string | null
  pdf_url: string
  show_name: boolean | null
  name_used: string | null
  meta: any
  user?: {
    full_name: string
  }
  module?: {
    title: string
  }
}

interface User {
  id: string
  full_name: string
  email: string
}

interface Module {
  id: string
  title: string
}

interface StorageTemplate {
  name: string
  id: string
  updated_at: string
  size: number
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

interface CertificatesResponse extends ApiResponse<Certificate[]> {
  certificates?: Certificate[];
}

interface UsersResponse extends ApiResponse<User[]> {
  users?: User[];
}

interface ModulesResponse extends ApiResponse<Module[]> {
  modules?: Module[];
}

interface StorageTemplatesResponse extends ApiResponse<StorageTemplate[]> {
  templates?: StorageTemplate[];
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [storageTemplates, setStorageTemplates] = useState<StorageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showName, setShowName] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [showCertificateNumber, setShowCertificateNumber] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCertificates(),
          fetchUsers(),
          fetchModules(),
          fetchStorageTemplates()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached')
      setLoading(false)
    }, 10000) // 10 second timeout

    loadData()

    return () => clearTimeout(timeoutId)
  }, [])

    const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/admin/certificates')

      if (response.ok) {
        const _data = await response.json() as CertificatesResponse
        setCertificates(_data.certificates || [])
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error('Failed to fetch certificates')
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    }
  }

    const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')

      if (response.ok) {
        const _data = await response.json()
        if (_data.success) {
          setUsers(_data.users || [])
        } else {
          throw new Error(_data.error || 'Failed to fetch users')
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

    const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules')

      if (response.ok) {
        const _data = await response.json()
        if (_data.success) {
          setModules(_data.modules || [])
        } else {
          throw new Error(_data.error || 'Failed to fetch modules')
        }
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

    const fetchStorageTemplates = async () => {
    try {
      const response = await fetch('/api/admin/storage-templates')

      if (response.ok) {
        const _data = await response.json() as StorageTemplatesResponse
        if (_data.success) {
          setStorageTemplates(_data.templates || [])
        } else {
          throw new Error(_data.error || 'Failed to fetch templates')
        }
      }
    } catch (error) {
      console.error('Error fetching storage templates:', error)
    }
  }

  const generateCertificate = async () => {
    if (!selectedUser || !selectedModule || !selectedTemplate) {
      alert('Bitte wählen Sie einen Benutzer, ein Modul und eine Vorlage aus.')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          moduleId: selectedModule,
          templateId: selectedTemplate,
          showName,
          showDate,
          showCertificateNumber
        })
      })

      if (response.ok) {
        const data = await response.json()
        void fetchCertificates()
        setSelectedUser('')
        setSelectedModule('')
        setSelectedTemplate('')
      } else {
        const errorData = await response.json()
        console.error('Error generating certificate:', errorData)
        alert('Fehler beim Generieren des Zertifikats: ' + (errorData.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Fehler beim Generieren des Zertifikats')
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async (fileUrl: string) => {
    try {
      // Get signed URL for the certificate
      const response = await fetch(`/api/admin/certificates/download?url=${encodeURIComponent(fileUrl)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'certificate.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error downloading certificate')
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

    const deleteCertificate = async (certificateId: string) => {
    try {
      // Parse the certificate ID to get user_id and module_id
      const [userId, moduleId] = certificateId.split('-')

      const response = await fetch(`/api/admin/certificates/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          module_id: moduleId,
        }),
      })

      if (response.ok) {
        void fetchCertificates()
      } else {
        const errorData = await response.json()
        console.error('Error deleting certificate:', errorData)
      }
    } catch (error) {
      console.error('Error deleting certificate:', error)
    }
  }

  const uploadTemplate = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-template', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        void fetchStorageTemplates()
      } else {
        const errorData = await response.json()
        console.error('Error uploading template:', errorData)
        alert('Fehler beim Hochladen der Vorlage: ' + (errorData.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error uploading template:', error)
      alert('Fehler beim Hochladen der Vorlage')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void uploadTemplate(file)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
            <span className="text-gray-600">Lade Zertifikate...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-8 py-8 space-y-8 bg-[#6e859a] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Zertifikate</h1>
        <p className="text-white mt-2">
          Verwalten Sie Zertifikate und Vorlagen für Ihre Kurse.
        </p>
      </div>

      {/* Generate Certificate */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Zertifikat generieren</h2>
          <p className="text-gray-600">
            Erstellen Sie ein neues Zertifikat für einen Benutzer.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="user" className="text-sm font-medium text-gray-700">Benutzer</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#486681] focus:ring-[#486681]">
                <SelectValue placeholder="Benutzer auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="module" className="text-sm font-medium text-gray-700">Modul</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#486681] focus:ring-[#486681]">
                <SelectValue placeholder="Modul auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="template" className="text-sm font-medium text-gray-700">Vorlage</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#486681] focus:ring-[#486681]">
                <SelectValue placeholder="Vorlage auswählen" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {storageTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showName"
                checked={showName}
                onCheckedChange={(checked) => setShowName(checked)}
              />
              <Label htmlFor="showName" className="text-sm text-gray-700">Namen anzeigen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDate"
                checked={showDate}
                onCheckedChange={(checked) => setShowDate(checked)}
              />
              <Label htmlFor="showDate" className="text-sm text-gray-700">Datum anzeigen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCertificateNumber"
                checked={showCertificateNumber}
                onCheckedChange={(checked) => setShowCertificateNumber(checked)}
              />
              <Label htmlFor="showCertificateNumber" className="text-sm text-gray-700">Zertifikatsnummer anzeigen</Label>
            </div>
          </div>

          <Button
            onClick={() => void generateCertificate()}
            disabled={generating || !selectedUser || !selectedModule || !selectedTemplate}
            className="w-full bg-[#486681] hover:bg-[#3e5570] text-white"
          >
            {generating ? 'Generiere...' : 'Zertifikat generieren'}
          </Button>
        </div>
      </div>

      {/* Upload Template */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vorlage hochladen</h2>
          <p className="text-gray-600">
            Laden Sie eine PDF-Vorlage hoch.
          </p>
        </div>

        <div>
          <Label htmlFor="fileUpload" className="text-sm font-medium text-gray-700">PDF-Datei auswählen</Label>
          <Input
            id="fileUpload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="bg-white border-gray-300 focus:border-[#486681] focus:ring-[#486681]"
          />
        </div>
      </div>

      {/* Existing Certificates */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vorhandene Zertifikate</h2>
          <p className="text-gray-600">
            Alle generierten Zertifikate.
          </p>
        </div>

        <div className="space-y-4">
                    {certificates
            .filter(certificate => certificate.user_id && certificate.module_id)
            .map((certificate, index) => (
              <div
                key={certificate.user_id && certificate.module_id
                  ? `${certificate.user_id}-${certificate.module_id}`
                  : `certificate-${index}`
                }
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-[#486681] text-white">
                      {certificate.user?.full_name || 'Unbekannter Benutzer'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {certificate.module?.title || 'Unbekanntes Modul'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Erstellt am: {formatDateSafely(certificate.issued_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {certificate.pdf_url && (
                    <Button
                      size="sm"
                      onClick={() => void downloadCertificate(certificate.pdf_url)}
                      className="bg-[#486681] hover:bg-[#3e5570] text-white"
                    >
                      Herunterladen
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void deleteCertificate(
                      certificate.user_id && certificate.module_id
                        ? `${certificate.user_id}-${certificate.module_id}`
                        : `certificate-${index}`
                    )}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
          {certificates.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Keine Zertifikate vorhanden.
            </p>
          )}
          {certificates.filter(c => !c.user_id || !c.module_id).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ {certificates.filter(c => !c.user_id || !c.module_id).length} Zertifikat(e) mit ungültigen Daten gefunden und ausgeblendet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Storage Templates */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hochgeladene Vorlagen</h2>
          <p className="text-gray-600">
            Alle verfügbaren PDF-Vorlagen.
          </p>
        </div>

        <div className="space-y-4">
          {storageTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">
                  Größe: {(template.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-sm text-gray-600">
                  Aktualisiert: {formatDateSafely(template.updated_at)}
                </p>
              </div>
              <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Verwenden
              </Button>
            </div>
          ))}
          {storageTemplates.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Keine Vorlagen vorhanden.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}