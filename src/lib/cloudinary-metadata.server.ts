import 'server-only'

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  'dqmofjqca'
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

type ImagePrefix = 'hero_image' | 'logo' | 'image'

type ExistingImageMetadata = {
  alt: string | null
  publicId: string | null
  width: number | null
  height: number | null
  format: string | null
}

type CloudinaryResource = {
  public_id?: string
  width?: number
  height?: number
  format?: string
  context?: {
    custom?: {
      alt?: string
      caption?: string
    }
  }
}

export type ImageMetadata = ExistingImageMetadata

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes('cloudinary.com')
}

export function extractPublicId(cloudinaryUrl: string): string | null {
  if (!isCloudinaryUrl(cloudinaryUrl)) {
    return null
  }

  try {
    const parsedUrl = new URL(cloudinaryUrl)
    const uploadMarker = '/upload/'
    const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker)

    if (uploadIndex === -1) {
      return null
    }

    const afterUpload = parsedUrl.pathname.slice(uploadIndex + uploadMarker.length)
    const pathParts = afterUpload.split('/').filter(Boolean)
    const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part))
    const publicIdParts =
      versionIndex >= 0 ? pathParts.slice(versionIndex + 1) : pathParts
    const publicIdPath = publicIdParts.join('/')

    return decodeURIComponent(publicIdPath).replace(/\.[^.]+$/, '') || null
  } catch {
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match?.[1]?.replace(/\.[^.]+$/, '') || null
  }
}

function getAltFromResource(data: CloudinaryResource): string | null {
  return data.context?.custom?.alt || data.context?.custom?.caption || null
}

function normalizeFallbackAlt(fallbackAlt: string | null | undefined) {
  return fallbackAlt?.trim() || null
}

export async function fetchCloudinaryImageMetadata(
  imageUrl: string,
  fallbackAlt?: string | null
): Promise<ImageMetadata | null> {
  const publicId = extractPublicId(imageUrl)

  if (!publicId) {
    return null
  }

  const fallback = normalizeFallbackAlt(fallbackAlt)
  const toMetadata = (data: CloudinaryResource): ImageMetadata => ({
    alt: getAltFromResource(data) || fallback,
    publicId: data.public_id || publicId,
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
    format: data.format || null,
  })

  if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    try {
      const authString = Buffer.from(
        `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`
      ).toString('base64')
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${encodeURIComponent(publicId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${authString}`,
          },
          cache: 'no-store',
        }
      )

      if (response.ok) {
        return toMetadata((await response.json()) as CloudinaryResource)
      }

      console.error(
        `Cloudinary Admin API metadata error for ${publicId}: ${response.status}`
      )
    } catch (error) {
      console.error(
        `Error fetching Cloudinary Admin API metadata for ${publicId}:`,
        error
      )
    }
  }

  try {
    const response = await fetch(
      `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/fl_getinfo/${publicId}.json`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      console.error(
        `Cloudinary fl_getinfo metadata error for ${publicId}: ${response.status}`
      )
      return {
        alt: fallback,
        publicId,
        width: null,
        height: null,
        format: null,
      }
    }

    return toMetadata((await response.json()) as CloudinaryResource)
  } catch (error) {
    console.error(`Error fetching Cloudinary metadata for ${publicId}:`, error)
    return {
      alt: fallback,
      publicId,
      width: null,
      height: null,
      format: null,
    }
  }
}

export function imageMetadataUpdate(
  prefix: ImagePrefix,
  metadata: ImageMetadata | null
) {
  return {
    [`${prefix}_alt`]: metadata?.alt ?? null,
    [`${prefix}_public_id`]: metadata?.publicId ?? null,
    [`${prefix}_width`]: metadata?.width ?? null,
    [`${prefix}_height`]: metadata?.height ?? null,
    [`${prefix}_format`]: metadata?.format ?? null,
  }
}

export async function resolveImageMetadataUpdate({
  prefix,
  imageUrl,
  previousImageUrl,
  previousMetadata,
  fallbackAlt,
}: {
  prefix: ImagePrefix
  imageUrl: string | null | undefined
  previousImageUrl?: string | null
  previousMetadata?: ExistingImageMetadata
  fallbackAlt?: string | null
}) {
  const normalizedUrl = imageUrl?.trim() || null
  const normalizedPreviousUrl = previousImageUrl?.trim() || null

  if (normalizedUrl && normalizedUrl === normalizedPreviousUrl && previousMetadata) {
    return imageMetadataUpdate(prefix, previousMetadata)
  }

  if (!normalizedUrl || !isCloudinaryUrl(normalizedUrl)) {
    return imageMetadataUpdate(prefix, null)
  }

  const metadata = await fetchCloudinaryImageMetadata(normalizedUrl, fallbackAlt)
  return imageMetadataUpdate(prefix, metadata)
}
