'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { iconOptions } from '@/data/iconOptions'
import { mediaLibrary } from '@/data/mediaLibrary'

interface Category { id: string; title: string; slug: string; sort_order: number }
interface Resource { id: string; category_id: string; title: string; description?: string | null; url: string; logo_url?: string | null; sort_order: number }
interface Slide { id: string; resource_id: string; title: string; body?: string | null; link_url?: string | null; image_url?: string | null; sort_order: number }

export default function DigiSammlungAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [slidesByResource, setSlidesByResource] = useState<Record<string, Slide[]>>({})

  const load = async () => {
    setLoading(true)
    const [c, r, s] = await Promise.all([
      fetch('/api/admin/digi-sammlung/categories').then(r => r.json()),
      fetch('/api/admin/digi-sammlung/resources').then(r => r.json()),
      fetch('/api/admin/digi-sammlung/slides').then(r => r.json()),
    ])
    setCategories(c.categories || [])
    setResources(r.resources || [])
    const groupedSlides: Record<string, Slide[]> = {}
    for (const sl of (s.slides || []) as Slide[]) {
      if (!groupedSlides[sl.resource_id]) groupedSlides[sl.resource_id] = []
      groupedSlides[sl.resource_id].push(sl)
    }
    setSlidesByResource(groupedSlides)
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const grouped = useMemo(() => {
    const map: Record<string, Resource[]> = {}
    for (const res of resources) {
      if (!map[res.category_id]) map[res.category_id] = []
      map[res.category_id].push(res)
    }
    return map
  }, [resources])

  const [catModal, setCatModal] = useState<{ open: boolean; title: string; icon: string }>({ open: false, title: '', icon: 'briefcase' })
  const [resModal, setResModal] = useState<{ open: boolean; category_id: string; title: string; url: string; logo_url: string }>({ open: false, category_id: '', title: '', url: '', logo_url: '' })

  const addCategory = () => setCatModal({ open: true, title: '', icon: 'briefcase' })
  const submitCategory = async () => {
    const title = catModal.title.trim(); if (!title) return
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    await fetch('/api/admin/digi-sammlung/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, slug, icon: catModal.icon }) })
    setCatModal({ open: false, title: '', icon: 'briefcase' })
    await load()
  }

  const addResource = (category_id: string) => setResModal({ open: true, category_id, title: '', url: '', logo_url: '' })
  const submitResource = async () => {
    const { category_id, title, url, logo_url } = resModal
    if (!title.trim() || !url.trim()) return
    await fetch('/api/admin/digi-sammlung/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_id, title: title.trim(), url: url.trim(), logo_url: logo_url.trim() || null }) })
    setResModal({ open: false, category_id: '', title: '', url: '', logo_url: '' })
    await load()
  }

  const saveResource = (res: Resource) => {
    fetch('/api/admin/digi-sammlung/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res) })
      .then(() => load())
  }

  if (loading) {
    return (
      <div className="w-full px-8 py-8"><div className="w-6 h-6 border-2 border-gray-300 border-t-[#486681] rounded-full animate-spin" /></div>
    )
  }

  return (
    <div className="w-full px-8 py-8 space-y-8 bg-transparent">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Digi-Sammlung</h1>
          <p className="text-white mt-2">Kategorien, Kacheln und Logos verwalten</p>
        </div>
        <button onClick={addCategory} className="bg-[#486681] hover:bg-[#3e5570] text-white px-4 py-2 rounded-md flex items-center gap-2"><Plus className="w-4 h-4"/>Kategorie</button>
      </div>

      {categories.map(cat => (
        <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{cat.title}</div>
            <button onClick={() => addResource(cat.id)} className="text-sm bg-[#486681] text-white rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3"/>Ressource</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(grouped[cat.id] || []).map(res => (
              <div key={res.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                <input value={res.title} onChange={e => res.title = e.target.value} className="w-full h-9 px-2 border rounded" />
                <input value={res.url} onChange={e => res.url = e.target.value} className="w-full h-9 px-2 border rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input value={res.logo_url || ''} onChange={e => res.logo_url = e.target.value} placeholder="Logo URL (optional)" className="h-9 px-2 border rounded w-full" />
                  <select defaultValue={res.logo_url || ''} onChange={e => res.logo_url = e.target.value} className="h-9 px-2 border rounded w-full">
                    <option value="">Aus Medienbibliothek wählen…</option>
                    {mediaLibrary.map(m => (
                      <option key={m.url} value={m.url}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => saveResource(res)} className="px-3 py-1 text-sm bg-[#486681] text-white rounded flex items-center gap-1"><Save className="w-3 h-3"/>Speichern</button>
                  <button onClick={() => fetch('/api/admin/digi-sammlung/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...res, deleted: true }) }).then(() => load())} className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded flex items-center gap-1"><Trash2 className="w-3 h-3"/>Entfernen</button>
                </div>
                {/* Slides table */}
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Slides</div>
                    <button onClick={() => fetch('/api/admin/digi-sammlung/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource_id: res.id, title: 'Neuer Slide', sort_order: (slidesByResource[res.id]?.length || 0) + 1 }) }).then(() => load())} className="text-sm bg-[#486681] text-white rounded px-3 py-1 flex items-center gap-1"><Plus className="w-3 h-3"/>Slide</button>
                  </div>
                  <div className="space-y-2">
                    {(slidesByResource[res.id] || []).map((sl) => (
                      <div key={sl.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-white border rounded">
                        <input defaultValue={sl.title} onChange={e => sl.title = e.target.value} className="h-9 px-2 border rounded" />
                        <input defaultValue={sl.link_url || ''} onChange={e => sl.link_url = e.target.value} placeholder="Link URL" className="h-9 px-2 border rounded" />
                        <div className="grid grid-cols-1 gap-2">
                          <input defaultValue={sl.image_url || ''} onChange={e => sl.image_url = e.target.value} placeholder="Bild URL" className="h-9 px-2 border rounded" />
                          <select defaultValue={sl.image_url || ''} onChange={e => sl.image_url = e.target.value} className="h-9 px-2 border rounded">
                            <option value="">Aus Medienbibliothek wählen…</option>
                            {mediaLibrary.map(m => (
                              <option key={m.url} value={m.url}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <textarea defaultValue={sl.body || ''} onChange={e => sl.body = e.target.value} placeholder="Text" className="h-20 px-2 border rounded" />
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <button onClick={() => fetch('/api/admin/digi-sammlung/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sl) }).then(() => load())} className="px-3 py-1 text-sm bg-[#486681] text-white rounded flex items-center gap-1"><Save className="w-3 h-3"/>Speichern</button>
                          <button onClick={() => fetch('/api/admin/digi-sammlung/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sl.id, deleted: true }) }).then(() => load())} className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded flex items-center gap-1"><Trash2 className="w-3 h-3"/>Löschen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Category Modal */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCatModal({ open: false, title: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Kategorie hinzufügen</h2>
              <button onClick={() => setCatModal({ open: false, title: '' })} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
            </div>
            <label className="text-sm font-medium mb-1 block">Titel</label>
            <input value={catModal.title} onChange={e => setCatModal({ ...catModal, title: e.target.value })} className="w-full h-10 px-3 border rounded" />
            <div className="mt-3">
              <label className="text-sm font-medium mb-1 block">Icon</label>
              <div className="flex items-center gap-3">
                <select value={catModal.icon} onChange={e => setCatModal({ ...catModal, icon: e.target.value })} className="h-10 px-3 border rounded flex-1">
                  {iconOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="w-10 h-10 rounded border flex items-center justify-center bg-gray-50">
                  {(() => {
                    const match = iconOptions.find(i => i.value === catModal.icon)
                    if (!match) return null
                    const I = match.Icon
                    return <I className="w-5 h-5 text-gray-700" />
                  })()}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Wählen Sie ein Icon (Lucide). Mehr können später ergänzt werden.</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCatModal({ open: false, title: '' })} className="px-4 py-2 border rounded">Abbrechen</button>
              <button onClick={() => void submitCategory()} className="px-4 py-2 bg-[#486681] text-white rounded">Speichern</button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {resModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setResModal({ open: false, category_id: '', title: '', url: '', logo_url: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ressource hinzufügen</h2>
              <button onClick={() => setResModal({ open: false, category_id: '', title: '', url: '', logo_url: '' })} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Titel</label>
                <input value={resModal.title} onChange={e => setResModal({ ...resModal, title: e.target.value })} className="w-full h-10 px-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">URL</label>
                <input value={resModal.url} onChange={e => setResModal({ ...resModal, url: e.target.value })} className="w-full h-10 px-3 border rounded" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Logo URL (optional)</label>
                <input value={resModal.logo_url} onChange={e => setResModal({ ...resModal, logo_url: e.target.value })} className="w-full h-10 px-3 border rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setResModal({ open: false, category_id: '', title: '', url: '', logo_url: '' })} className="px-4 py-2 border rounded">Abbrechen</button>
              <button onClick={() => void submitResource()} className="px-4 py-2 bg-[#486681] text-white rounded">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
