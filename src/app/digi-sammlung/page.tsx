import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, MessageSquare, LifeBuoy } from 'lucide-react'

export const metadata = { title: 'Digi-Sammlung' }

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

const categories = [
  {
    title: 'Erwerbsarbeit',
    icon: Briefcase,
    color: 'text-pink-600',
    items: [
      'Jobsuche / Berufsorientierung',
      'Bewerbungsvideos erstellen',
      'Rechner für Gehalt & Lohn',
      'Weiterbildung: Anbieter',
      'Weiterbildungen: Förderungen',
      'Einstufung Digi-Kompetenz',
    ],
  },
  {
    title: 'Kommunikation, Medien & Technisches',
    icon: MessageSquare,
    color: 'text-pink-600',
    items: [
      'Einfache Sprache Infos',
      'Einfache Sprache Nachrichten',
      'Videotelefonie / Videokonferenzen',
      'Alternative Messenger',
      'Alternative Suchmaschinen',
      'Medien - Bücher, Musik',
      'Technische Tipps & Tricks',
      'Werkzeuge für Online Umfragen',
      'Sicherheit im Internet',
      'Beratungs-App',
    ],
  },
  {
    title: 'Alltägliches & Verschiedenes',
    icon: LifeBuoy,
    color: 'text-pink-600',
    items: [
      'ID-Austria und eGov',
      'Fitness für das Gehirn',
      'Entspannung & Achtsamkeit',
      'Digitale Helfer im Alltag',
      'Mobilität & Unterwegs',
      'Lernen mit dem Handy',
      'Freizeit & Spaß im Digitalen',
      'Gesund werden & bleiben',
      'Studien zum Digitalen',
      'Diverse Unterlagen',
    ],
  },
] as const

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^(-)+|(-)+$/g, '')
}

export default function DigiSammlungPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-32">
      {categories.map(({ title, icon: Icon, items, color }) => (
        <section key={title} className="flex flex-col items-center gap-10">
          <Icon className="h-8 w-8 text-foreground" />
          <h2 className={`text-3xl font-bold ${color} text-center`}>{title}</h2>

          {/* Buttons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full max-w-5xl">
            {items.map((label) => (
              <Button
                key={label}
                asChild
                variant="secondary"
                size="lg"
                className="bg-[#38536A] text-white hover:bg-[#2c4255] h-24 md:h-28 whitespace-normal leading-snug text-sm md:text-base font-medium rounded-lg shadow-md transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-primary/30 px-4"
              >
                <Link href={`#${slugify(label)}`}>{label}</Link>
              </Button>
            ))}
          </div>
        </section>
      ))}

      {/* Detailed sections placeholder */}
      <div className="space-y-24">
        {categories.flatMap((c) => c.items).map((label) => (
          <section key={label} id={slugify(label)} className="scroll-mt-24">
            <h3 className="text-2xl font-semibold mb-6 text-center text-pink-600">
              {label}
            </h3>
            <div className="mx-auto max-w-3xl">
              <p className="text-center text-foreground/70">
                Hier folgt demnächst ein interaktives Carousel mit detaillierten
                Ressourcen zu &ldquo;{label}&rdquo;.
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}