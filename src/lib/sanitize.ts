'use client'

import DOMPurify from 'dompurify'

/**
 * Sanitize rich HTML content while allowing safe YouTube embeds.
 */
export function sanitizeLessonHtml(html: string | null | undefined): string {
  if (!html) return ''

  const YT_SRC_REGEX =
    /^(https?:)?\/\/(www\.)?(youtube-nocookie\.com|youtube\.com|youtu\.be)\//i

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'referrerpolicy',
      'width',
      'height',
    ],
    FORBID_TAGS: ['script', 'style'],
    ALLOWED_URI_REGEXP: YT_SRC_REGEX,
  })
}

/**
 * Extracts a YouTube video ID from various URL formats.
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null
    }
    if (u.searchParams.has('v')) {
      return u.searchParams.get('v')
    }
    const pathParts = u.pathname.split('/')
    const embedIdx = pathParts.indexOf('embed')
    if (embedIdx !== -1 && pathParts[embedIdx + 1]) {
      return pathParts[embedIdx + 1]
    }
    return null
  } catch (_e) {
    return null
  }
}
