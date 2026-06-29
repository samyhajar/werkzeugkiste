'use client'

import Image, { ImageProps } from 'next/image'

interface CloudinaryImageProps extends Omit<ImageProps, 'alt'> {
  src: string
  alt: string
}

/**
 * Image wrapper kept for existing Cloudinary image call sites.
 * ALT text must come from application data, not runtime Cloudinary fetches.
 */
export default function CloudinaryImage({
  src,
  alt,
  ...props
}: CloudinaryImageProps) {
  return <Image src={src} alt={alt} {...props} />
}

/**
 * Regular img element version for when Next.js Image isn't needed
 */
interface CloudinaryImgProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  src: string
  alt: string
}

export function CloudinaryImg({
  src,
  alt,
  ...props
}: CloudinaryImgProps) {
  return <img src={src} alt={alt} {...props} />
}
