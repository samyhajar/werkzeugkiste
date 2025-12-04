'use client'

import { CloudinaryImg } from '@/components/shared/CloudinaryImage'

interface ResourceLogoProps {
  src: string
  title: string
  className?: string
}

/**
 * Client component wrapper for resource logos
 * Fetches ALT text from Cloudinary automatically
 */
export default function ResourceLogo({
  src,
  title,
  className,
}: ResourceLogoProps) {
  return (
    <CloudinaryImg
      src={src}
      fallbackAlt={title}
      className={className || 'max-h-10 max-w-28 object-contain'}
    />
  )
}
