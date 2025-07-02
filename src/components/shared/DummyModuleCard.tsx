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
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <p className="text-sm line-clamp-3 text-foreground/80 min-h-[4.5rem]">
          Ein neues Modul wird in Kürze hier erscheinen. Schauen Sie bald wieder
          vorbei!
        </p>
        <div>
          <p className="text-sm font-medium mb-2">Demnächst</p>
          <span className="block text-center border rounded py-1 text-sm cursor-not-allowed">
            Modul starten
          </span>
        </div>
      </CardContent>
    </Card>
  )
}