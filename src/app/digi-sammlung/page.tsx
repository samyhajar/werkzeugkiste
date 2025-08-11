import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, MessageSquare, LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server-client'
import ResourceCarousel from './ResourceCarousel'

export const metadata = { title: 'Digi-Sammlung' }

export const dynamic = 'force-dynamic'

const defaultCategories = [
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

async function fetchStructured() {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from('digi_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  const { data: res } = await supabase
    .from('digi_resources')
    .select('*')
    .order('sort_order', { ascending: true })
  return { cats: cats || [], res: res || [] }
}

export default async function DigiSammlungPage() {
  const { cats, res } = await fetchStructured()
  const categories = cats.length > 0
    ? cats.map((c) => ({
        title: c.title,
        icon: c.icon === 'message-square' ? MessageSquare : c.icon === 'life-buoy' ? LifeBuoy : Briefcase,
        color: 'text-pink-600',
        items: (res || []).filter(r => r.category_id === c.id).map(r => r.title)
      }))
    : defaultCategories

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

      {/* Detailed sections */}
      <div className="space-y-24">
        {(cats.length > 0 ? cats : []).map((cat) => {
          const resources = (res || []).filter(r => r.category_id === cat.id)
          return (
            <section key={cat.id} id={slugify(cat.title)} className="scroll-mt-24">
              <h3 className="text-2xl font-semibold mb-6 text-center text-pink-600">
                {cat.title}
              </h3>
              {resources.length === 0 ? (
                <div className="mx-auto max-w-3xl">
                  <p className="text-center text-foreground/70">Keine Ressourcen vorhanden.</p>
                </div>
              ) : (
                <div className="mx-auto max-w-5xl space-y-12">
                  {resources.map((r) => (
                    <div key={r.id} id={slugify(r.title)} className="space-y-3">
                      <div className="flex items-center gap-3">
                        {r.logo_url && (
                          <div className="h-10 w-28 flex items-center justify-center overflow-hidden">
                            { }
                            <img src={r.logo_url} alt={r.title} className="max-h-10 max-w-28 object-contain" />
                          </div>
                        )}
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-[#38536A] underline">
                          {r.title}
                        </a>
                      </div>
                      {/* Slides carousel */}
                      <ResourceCarousel resourceId={r.id} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}