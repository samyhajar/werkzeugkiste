export const metadata = { title: 'Über Uns' }

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function UeberUnsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Über Uns</h1>
      <p>Hier entsteht die öffentliche Über-uns-Seite.</p>
    </main>
  )
}