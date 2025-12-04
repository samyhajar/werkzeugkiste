'use client'

import { CloudinaryImg } from '@/components/shared/CloudinaryImage'

interface SlideImageProps {
  src: string
  title: string
  className?: string
}

/**
 * Client component wrapper for slide images
 * Fetches ALT text from Cloudinary automatically
 */
export default function SlideImage({ src, title, className }: SlideImageProps) {
  return (
    <CloudinaryImg
      src={src}
      fallbackAlt={title}
      className={className || 'max-h-28 w-auto object-contain'}
    />
  )
}
