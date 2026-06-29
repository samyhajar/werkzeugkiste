'use client'

import { CloudinaryImg } from '@/components/shared/CloudinaryImage'

interface SlideImageProps {
  src: string
  alt: string
  className?: string
}

/**
 * Client component wrapper for slide images.
 */
export default function SlideImage({ src, alt, className }: SlideImageProps) {
  return (
    <CloudinaryImg
      src={src}
      alt={alt}
      className={className || 'max-h-28 w-auto object-contain'}
    />
  )
}
