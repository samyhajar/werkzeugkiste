'use client'

import { useEffect, useState } from 'react'

interface AltTextCache {
  [url: string]: string
}

// Client-side cache for ALT texts
const clientCache: AltTextCache = {}

/**
 * Hook to fetch ALT text from Cloudinary for an image URL
 * Returns the ALT text or a fallback value
 */
export function useCloudinaryAlt(
  imageUrl: string | null | undefined,
  fallback: string = ''
): string {
  const [altText, setAltText] = useState<string>(fallback)

  useEffect(() => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      setAltText(fallback)
      return
    }

    // Check client cache first
    if (clientCache[imageUrl]) {
      setAltText(clientCache[imageUrl])
      return
    }

    // Fetch from API
    const fetchAltText = async () => {
      try {
        const response = await fetch(
          `/api/cloudinary/alt-text?url=${encodeURIComponent(imageUrl)}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.altText) {
            clientCache[imageUrl] = data.altText
            setAltText(data.altText)
          } else {
            setAltText(fallback)
          }
        } else {
          setAltText(fallback)
        }
      } catch (error) {
        console.error('Failed to fetch ALT text:', error)
        setAltText(fallback)
      }
    }

    fetchAltText()
  }, [imageUrl, fallback])

  return altText
}

/**
 * Hook to batch fetch ALT texts for multiple images
 * Useful for lists of modules/courses
 */
export function useCloudinaryAlts(
  imageUrls: (string | null | undefined)[],
  fallbacks: string[] = []
): Map<string, string> {
  const [altTexts, setAltTexts] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const cloudinaryUrls = imageUrls.filter(
      (url): url is string => !!url && url.includes('cloudinary.com')
    )

    if (cloudinaryUrls.length === 0) {
      return
    }

    // Check which URLs need fetching
    const urlsToFetch = cloudinaryUrls.filter(url => !clientCache[url])

    if (urlsToFetch.length === 0) {
      // All in cache
      const cached = new Map<string, string>()
      cloudinaryUrls.forEach((url, index) => {
        cached.set(url, clientCache[url] || fallbacks[index] || '')
      })
      setAltTexts(cached)
      return
    }

    // Fetch missing ALT texts
    const fetchAltTexts = async () => {
      try {
        const response = await fetch('/api/cloudinary/alt-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: urlsToFetch }),
        })

        if (response.ok) {
          const data = await response.json()

          // Update client cache
          Object.entries(data.altTexts).forEach(([url, alt]) => {
            clientCache[url] = alt as string
          })

          // Build result map
          const result = new Map<string, string>()
          cloudinaryUrls.forEach((url, index) => {
            result.set(url, clientCache[url] || fallbacks[index] || '')
          })
          setAltTexts(result)
        }
      } catch (error) {
        console.error('Failed to fetch ALT texts:', error)
      }
    }

    fetchAltTexts()
  }, [imageUrls.join(','), fallbacks.join(',')])

  return altTexts
}
