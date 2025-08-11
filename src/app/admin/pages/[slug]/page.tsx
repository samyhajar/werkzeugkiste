export const dynamic = 'force-dynamic'

import EditorClient from './EditorClient'

export default function EditStaticPage({ params }: { params: { slug: string } }) {
  return (
    <div className="w-full px-8 py-8 space-y-8 bg-transparent">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Seite bearbeiten</h1>
          <p className="text-white mt-2">Inhalte aktualisieren und speichern</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Client editor */}
          <EditorClient slug={params.slug} />
        </div>
      </div>
    </div>
  )
}
