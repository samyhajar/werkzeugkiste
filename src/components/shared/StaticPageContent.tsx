'use client'

import CloudinaryHtmlContent from '@/components/shared/CloudinaryHtmlContent'

interface StaticPageContentProps {
  html: string
  className?: string
}

/**
 * Client component wrapper for rendering static page HTML content
 * with automatic Cloudinary ALT text fetching
 */
export default function StaticPageContent({
  html,
  className,
}: StaticPageContentProps) {
  return <CloudinaryHtmlContent html={html} className={className} />
}
