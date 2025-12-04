'use client'

import { useCloudinaryAlt } from '@/hooks/useCloudinaryAlt'
import Image, { ImageProps } from 'next/image'

interface CloudinaryImageProps extends Omit<ImageProps, 'alt'> {
  src: string
  fallbackAlt: string
}

/**
 * Image component that automatically fetches ALT text from Cloudinary
 * If no ALT text is set in Cloudinary, falls back to the provided fallbackAlt
 *
 * Usage:
 * <CloudinaryImage
 *   src={imageUrl}
 *   fallbackAlt="Description"
 *   width={400}
 *   height={300}
 * />
 */
export default function CloudinaryImage({
  src,
  fallbackAlt,
  ...props
}: CloudinaryImageProps) {
  const altText = useCloudinaryAlt(src, fallbackAlt)

  return <Image src={src} alt={altText} {...props} />
}

/**
 * Regular img element version for when Next.js Image isn't needed
 */
interface CloudinaryImgProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  src: string
  fallbackAlt: string
}

export function CloudinaryImg({
  src,
  fallbackAlt,
  ...props
}: CloudinaryImgProps) {
  const altText = useCloudinaryAlt(src, fallbackAlt)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={altText} {...props} />
  )
}
