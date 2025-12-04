'use client'

import { extractPublicId, isCloudinaryUrl } from '@/lib/cloudinary'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

interface CloudinaryHtmlContentProps {
  html: string | null | undefined
  className?: string
}

/**
 * Component that renders HTML content and automatically fetches
 * ALT texts from Cloudinary for any Cloudinary images found in the content.
 *
 * This processes the HTML, finds all Cloudinary images, fetches their ALT texts,
 * and updates the img tags before rendering.
 */
export default function CloudinaryHtmlContent({
  html,
  className,
}: CloudinaryHtmlContentProps) {
  const [processedHtml, setProcessedHtml] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    if (!html) {
      setProcessedHtml('')
      setIsProcessing(false)
      return
    }

    const processHtml = async () => {
      setIsProcessing(true)

      try {
        // Parse HTML to find Cloudinary images
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = doc.querySelectorAll('img')

        // Collect Cloudinary image URLs
        const cloudinaryImages: { img: HTMLImageElement; url: string }[] = []
        images.forEach(img => {
          const src = img.getAttribute('src')
          if (src && isCloudinaryUrl(src)) {
            cloudinaryImages.push({ img, url: src })
          }
        })

        // Fetch ALT texts for Cloudinary images
        if (cloudinaryImages.length > 0) {
          const urls = cloudinaryImages.map(ci => ci.url)

          try {
            const response = await fetch('/api/cloudinary/alt-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ urls }),
            })

            if (response.ok) {
              const data = await response.json()

              // Update image ALT texts
              cloudinaryImages.forEach(({ img, url }) => {
                const altText = data.altTexts[url]
                if (altText) {
                  img.setAttribute('alt', altText)
                }
              })
            }
          } catch (error) {
            console.error('Failed to fetch ALT texts for HTML content:', error)
          }
        }

        // Get the processed HTML
        const bodyHtml = doc.body.innerHTML
        setProcessedHtml(bodyHtml)
      } catch (error) {
        console.error('Error processing HTML:', error)
        setProcessedHtml(html)
      } finally {
        setIsProcessing(false)
      }
    }

    processHtml()
  }, [html])

  // Show original HTML while processing (to avoid flash)
  const displayHtml = isProcessing ? html || '' : processedHtml

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  )
}
