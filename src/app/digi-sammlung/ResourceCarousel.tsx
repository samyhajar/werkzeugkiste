import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'
import SlideImage from './SlideImage'

type DigiResourceSlide =
  Database['public']['Tables']['digi_resource_slides']['Row']

export const revalidate = 60

export default async function ResourceCarousel({
  resourceId,
}: {
  resourceId: string
}) {
  const supabase = await createClient()
  const { data: slides } = await supabase
    .from('digi_resource_slides')
    .select('*')
    .eq('resource_id', resourceId)
    .order('sort_order', { ascending: true })

  const slidesData = (slides || []) as DigiResourceSlide[]

  if (!slidesData || slidesData.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-x-auto flex gap-4 snap-x px-1 py-2">
      {slidesData.map(s => (
        <div
          key={s.id}
          className="min-w-[280px] max-w-[320px] snap-start bg-white border rounded-lg shadow-sm p-4"
        >
          {s.image_url && (
            <div className="h-28 w-full flex items-center justify-center overflow-hidden rounded mb-3">
              <SlideImage src={s.image_url} title={s.title} />
            </div>
          )}
          <div className="font-medium mb-1">{s.title}</div>
          {s.body && (
            <p className="text-sm text-gray-600 line-clamp-4">{s.body}</p>
          )}
          {s.link_url && (
            <a
              href={s.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-[#38536A] underline"
            >
              Mehr
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
