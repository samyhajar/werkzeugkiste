/**
 * Cloudinary utilities for fetching image metadata including ALT texts
 * ALT texts are managed by Martina in the Cloudinary console
 */

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dqmofjqca'
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
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary API credentials not configured')
    return null
  }

  // Check cache first
  const cached = altTextCache[publicId]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.alt
  }

  try {
    // Use Basic Auth header instead of credentials in URL
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

    if (!response.ok) {
      console.error(`Cloudinary API error for ${publicId}: ${response.status}`)
      return null
    }

    const data: CloudinaryResource = await response.json()
    const altText = data.context?.custom?.alt || null

    // Cache the result
    if (altText) {
      altTextCache[publicId] = {
        alt: altText,
        fetchedAt: Date.now(),
      }
    }

    return altText
  } catch (error) {
    console.error(`Error fetching Cloudinary ALT text for ${publicId}:`, error)
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
