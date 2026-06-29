'use client'

import { isProtectedImageUrl } from '@/lib/image-protection'
import { useEffect, useState } from 'react'

interface CloudinaryHtmlContentProps {
  html: string | null | undefined
  className?: string
}

/**
 * Component that renders HTML content and applies client-side image protection.
 * ALT text is expected to already be present in stored HTML.
 */
export default function CloudinaryHtmlContent({
  html,
  className,
}: CloudinaryHtmlContentProps) {
  const [processedHtml, setProcessedHtml] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    let isActive = true

    if (!html) {
      if (isActive) {
        setProcessedHtml('')
        setIsProcessing(false)
      }
      return () => {
        isActive = false
      }
    }

    const processHtml = () => {
      if (isActive) {
        setIsProcessing(true)
      }

      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = doc.querySelectorAll('img')

        images.forEach(img => {
          img.setAttribute('draggable', 'false')
          img.setAttribute('data-protect-image', 'true')
        })

        const links = doc.querySelectorAll('a')
        links.forEach(link => {
          const href = link.getAttribute('href')
          const download = link.getAttribute('download')

          if (isProtectedImageUrl(href) || isProtectedImageUrl(download)) {
            link.removeAttribute('href')
            link.removeAttribute('download')
            link.removeAttribute('target')
            link.removeAttribute('rel')
            link.setAttribute('aria-disabled', 'true')
            link.setAttribute('data-protected-image-link', 'true')
            link.setAttribute('tabindex', '-1')
          }
        })

        const bodyHtml = doc.body.innerHTML
        if (isActive) {
          setProcessedHtml(bodyHtml)
        }
      } catch (error) {
        if (isActive) {
          console.error('Error processing HTML:', error)
          setProcessedHtml(html)
        }
      } finally {
        if (isActive) {
          setIsProcessing(false)
        }
      }
    }

    processHtml()

    return () => {
      isActive = false
    }
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
