'use client'

import DOMPurify from 'dompurify'

/**
 * Sanitize rich HTML content while allowing safe YouTube embeds.
 */
export function sanitizeLessonHtml(html: string | null | undefined): string {
  if (!html) return ''

  // Allow standard HTML including <img>, and allow <iframe> but only from YouTube domains.
  // Previously, ALLOWED_URI_REGEXP restricted ALL URLs (including <img src>) to YouTube,
  // which stripped image sources and made lesson images disappear. We now:
  // 1) Remove the global URL restriction so images and links work normally
  // 2) Add a hook that removes non‑YouTube iframes for safety

  const youtubeSrcRegex = /^(https?:)?\/\/(www\.)?(youtube-nocookie\.com|youtube\.com|youtu\.be)\//i

  const iframeWhitelistHook = (node: Element) => {
    if (node.nodeName.toLowerCase() === 'iframe') {
      const src = (node as HTMLIFrameElement).getAttribute('src') || ''
      if (!youtubeSrcRegex.test(src)) {
        node.parentNode?.removeChild(node)
      }
    }
  }

  // Add hook, sanitize, then remove hook to avoid global side effects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(DOMPurify as any).addHook?.('uponSanitizeElement', iframeWhitelistHook)
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['iframe'],
      ADD_ATTR: [
        'class',
        'src',
        'allow',
        'allowfullscreen',
        'frameborder',
        'referrerpolicy',
        'width',
        'height',
      ],
      FORBID_TAGS: ['script', 'style'],
      // Do NOT set ALLOWED_URI_REGEXP globally to keep <img src>, <a href>, etc. working
    })
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(DOMPurify as any).removeHook?.('uponSanitizeElement', iframeWhitelistHook)
  }
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
