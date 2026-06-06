const IMAGE_FILE_EXTENSION_REGEX =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:[?#].*)?$/i

export function isProtectedImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false
  }

  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return false
  }

  if (trimmedUrl.startsWith('data:image/') || trimmedUrl.startsWith('blob:')) {
    return true
  }

  try {
    const parsedUrl = new URL(trimmedUrl, window.location.origin)
    const nestedImageUrl = parsedUrl.searchParams.get('url')

    if (nestedImageUrl && isProtectedImageUrl(nestedImageUrl)) {
      return true
    }

    return (
      IMAGE_FILE_EXTENSION_REGEX.test(parsedUrl.pathname) ||
      (parsedUrl.hostname.includes('cloudinary.com') &&
        parsedUrl.pathname.includes('/image/'))
    )
  } catch {
    return (
      IMAGE_FILE_EXTENSION_REGEX.test(trimmedUrl) ||
      trimmedUrl.includes('cloudinary.com')
    )
  }
}
