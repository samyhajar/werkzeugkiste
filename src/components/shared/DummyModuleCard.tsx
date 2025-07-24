import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function DummyModuleCard() {
  return (
    <Card className="w-full flex flex-col opacity-80">
      <Image
        src="/globe.svg"
        alt="Coming soon"
        width={400}
        height={220}
        className="w-full h-40 object-contain p-8 bg-muted"
      />
      <CardHeader>
        <CardTitle className="text-brand-secondary min-h-[3rem]">
          Bald verfügbar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-6">
        {/* Fixed height content area to match ModuleCard */}
        <div className="flex-1 flex flex-col" style={{ minHeight: '200px' }}>
          {/* Title with fixed height */}
          <CardTitle className="text-brand-secondary mb-4 leading-tight" style={{ minHeight: '3rem', maxHeight: '3rem', overflow: 'hidden' }}>
            Bald verfügbar
          </CardTitle>

          {/* Description with fixed height */}
          <p className="text-sm line-clamp-3 text-foreground/80 leading-relaxed mb-6" style={{ minHeight: '4.5rem', maxHeight: '4.5rem' }}>
            Ein neues Modul wird in Kürze hier erscheinen. Schauen Sie bald wieder
            vorbei!
          </p>

          {/* Placeholder for progress bar area to maintain consistent spacing */}
          <div className="space-y-2 mb-4 mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-400">Fortschritt</span>
              <span className="text-sm font-semibold text-gray-400">0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gray-300 h-3 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Price and Button */}
        <div className="mt-auto">
          <p className="text-lg font-semibold text-gray-400 mb-4 text-right">Demnächst</p>
          <span className="block w-full border-2 border-gray-200 bg-gray-100 text-gray-400 text-center py-3 rounded-lg font-medium cursor-not-allowed">
            Modul starten
          </span>
        </div>
      </CardContent>
    </Card>
  )
}