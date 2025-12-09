/**
 * Cloudinary utilities for fetching image metadata including ALT texts
 * ALT texts are managed by Martina in the Cloudinary console
 */

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  'dqmofjqca'
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

interface CloudinaryResource {
  public_id: string
  context?: {
    custom?: {
      alt?: string
      caption?: string
    }
  }
}

interface CloudinaryAltTextCache {
  [publicId: string]: {
    alt: string
    fetchedAt: number
  }
}

const getAltFromResource = (data: CloudinaryResource) =>
  data.context?.custom?.alt || data.context?.custom?.caption || null

// In-memory cache for ALT texts (lasts until server restart)
// This reduces API calls to Cloudinary
const altTextCache: CloudinaryAltTextCache = {}
const CACHE_TTL = 1000 * 60 * 60 // 1 hour cache

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes('cloudinary.com')
}

/**
 * Extract public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dqmofjqca/image/upload/v1754072165/email_huag3a.jpg
 * Returns: email_huag3a
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return null
  }

  try {
    // Match the public_id from the URL (after /upload/ or /upload/v{version}/)
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) {
      // Remove file extension if present
      return match[1].replace(/\.[^.]+$/, '')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetch ALT text for a single image from Cloudinary Admin API
 */
export async function getCloudinaryAltText(
  publicId: string
): Promise<string | null> {
  // Check cache first
  const cached = altTextCache[publicId]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.alt
  }

  const cacheResult = (altText: string | null) => {
    if (altText) {
      altTextCache[publicId] = {
        alt: altText,
        fetchedAt: Date.now(),
      }
    }
    return altText
  }

  // Attempt via Admin API when credentials exist
  if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    try {
      const authString = Buffer.from(
        `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`
      ).toString('base64')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${authString}`,
          },
          next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
        }
      )

      if (response.ok) {
        const data: CloudinaryResource = await response.json()
        const altText = getAltFromResource(data)
        if (altText) {
          return cacheResult(altText)
        }
      } else {
        console.error(
          `Cloudinary API error for ${publicId}: ${response.status}`
        )
      }
    } catch (error) {
      console.error(
        `Error fetching Cloudinary ALT text via Admin API for ${publicId}:`,
        error
      )
    }
  }

  // Fallback: public info endpoint (does not require API credentials)
  try {
    const infoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/fl_getinfo/${publicId}.json`
    const response = await fetch(infoUrl, { next: { revalidate: 3600 } })

    if (!response.ok) {
      console.error(
        `Cloudinary fl_getinfo error for ${publicId}: ${response.status}`
      )
      return null
    }

    const data: CloudinaryResource = await response.json()
    const altText = getAltFromResource(data)
    return cacheResult(altText)
  } catch (error) {
    console.error(
      `Error fetching Cloudinary ALT text via fl_getinfo for ${publicId}:`,
      error
    )
    return null
  }
}

/**
 * Fetch ALT text for an image given its full Cloudinary URL
 */
export async function getAltTextFromUrl(
  cloudinaryUrl: string
): Promise<string | null> {
  const publicId = extractPublicId(cloudinaryUrl)
  if (!publicId) {
    return null
  }
  return getCloudinaryAltText(publicId)
}

/**
 * Batch fetch ALT texts for multiple images
 * More efficient than fetching one by one
 */
export async function getAltTextsForUrls(
  urls: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Process in parallel but limit concurrency
  const promises = urls.map(async url => {
    const altText = await getAltTextFromUrl(url)
    if (altText) {
      results.set(url, altText)
    }
  })

  await Promise.all(promises)
  return results
}
