'use client'

import { useEffect, useState, useCallback } from 'react'
import RichTextEditor from '@/components/ui/rich-text-editor'

export default function EditorClient({ slug }: { slug: string }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/static-pages/${slug}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setTitle(data.page?.title || slug)
      setContent(data.page?.content_html || '')
    } catch (e: any) {
      setError(e.message || 'Fehler beim Laden der Seite')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setSuccess(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/static-pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content_html: content }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      setSuccess('Gespeichert')
    } catch (e: any) {
      setError(e.message || 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" />
          <span className="text-gray-600">Laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="w-full bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="w-full bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-700">{success}</div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="text-xs font-semibold text-gray-700 block mb-1">Titel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="text-xs font-semibold text-gray-700 block mb-2">Inhalt</label>
        <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-md">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Schreiben Sie den Seiteninhalt hier..."
            className="min-h-[300px]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => void load()}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] disabled:opacity-50"
        >
          Zurücksetzen
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-[#486681] border border-transparent rounded-md hover:bg-[#3e5570] focus:outline-none focus:ring-2 focus:ring-[#486681]/20 disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
