import { loadDigiResourceSlides } from '@/lib/digi-sammlung/public-data'
import SlideImage from './SlideImage'

export const revalidate = 3600

export default async function ResourceCarousel({
  resourceId,
}: {
  resourceId: string
}) {
  const slidesData = await loadDigiResourceSlides(resourceId)

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
              <SlideImage src={s.image_url} alt={s.image_alt || s.title} />
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
