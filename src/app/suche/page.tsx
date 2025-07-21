// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function SuchePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Suche</h1>
          <p className="text-blue-100 mt-2">Durchsuchen Sie unsere Lernmodule</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-gray-600 mb-4">
            Die Suchfunktion wird bald verfügbar sein
          </div>
          <p className="text-gray-400 text-sm">
            Schauen Sie später wieder vorbei oder besuchen Sie unsere Lernmodule.
          </p>
        </div>
      </main>
    </div>
  )
}