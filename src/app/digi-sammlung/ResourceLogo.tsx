'use client'

import { CloudinaryImg } from '@/components/shared/CloudinaryImage'

interface ResourceLogoProps {
  src: string
  alt: string
  className?: string
}

/**
 * Client component wrapper for resource logos.
 */
export default function ResourceLogo({
  src,
  alt,
  className,
}: ResourceLogoProps) {
  return (
    <CloudinaryImg
      src={src}
      alt={alt}
      className={className || 'max-h-10 max-w-28 object-contain'}
    />
  )
}
