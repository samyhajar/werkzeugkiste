import { parse } from 'node-html-parser'
import sanitizeHtml from 'sanitize-html'

const YOUTUBE_HOST_REGEX = /(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/i

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getYouTubeId(src: string): string | null {
  try {
    const url = new URL(src, 'https://www.youtube.com')

    if (!YOUTUBE_HOST_REGEX.test(url.hostname)) {
      return null
    }

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace('/', '').split('/')[0] || null
    }

    const watchId = url.searchParams.get('v')
    if (watchId) {
      return watchId
    }

    const pathParts = url.pathname.split('/').filter(Boolean)
    const embedIndex = pathParts.indexOf('embed')
    if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
      return pathParts[embedIndex + 1]
    }

    return null
  } catch {
    return null
  }
}

export function withPdfCacheBust(
  url: string | null | undefined,
  cacheKey: string | null | undefined
): string {
  if (!url || !cacheKey || url.startsWith('data:') || url.startsWith('blob:')) {
    return url || ''
  }

  try {
    const parsedUrl = new URL(url)
    parsedUrl.searchParams.set('pdfv', cacheKey)
    return parsedUrl.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}pdfv=${encodeURIComponent(cacheKey)}`
  }
}

function transformImages(html: string, cacheKey?: string): string {
  const root = parse(html)

  root.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src')
    if (src) {
      img.setAttribute('src', withPdfCacheBust(src, cacheKey))
    }
  })

  return root.toString()
}

function transformYouTubeEmbeds(html: string): string {
  const root = parse(html)

  root.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || ''
    const videoId = getYouTubeId(src)

    if (!videoId) {
      iframe.remove()
      return
    }

    const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    const thumbnailUrl = `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`

    iframe.replaceWith(
      parse(`
        <figure class="pdf-video-block">
          <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHtml(thumbnailUrl)}" alt="Video-Vorschau" />
            <span>Video öffnen</span>
          </a>
          <figcaption>${escapeHtml(videoUrl)}</figcaption>
        </figure>
      `)
    )
  })

  return root.toString()
}

export function sanitizeModuleLessonHtml(
  html: string | null | undefined,
  options: { cacheKey?: string | null } = {}
): string {
  if (!html?.trim()) {
    return ''
  }

  const transformedHtml = transformYouTubeEmbeds(
    transformImages(html, options.cacheKey || undefined)
  )

  return sanitizeHtml(transformedHtml, {
    allowedTags: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'div',
      'em',
      'figcaption',
      'figure',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'img',
      'li',
      'mark',
      'ol',
      'p',
      'pre',
      's',
      'span',
      'strong',
      'sub',
      'sup',
      'table',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'tr',
      'u',
      'ul',
    ],
    allowedAttributes: {
      '*': ['class', 'style', 'title'],
      a: ['href', 'name', 'rel', 'target', 'title'],
      img: ['alt', 'class', 'height', 'src', 'style', 'title', 'width'],
      td: ['class', 'colspan', 'rowspan', 'style'],
      th: ['class', 'colspan', 'rowspan', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowedStyles: {
      '*': {
        'background-color': [
          /^#[0-9a-f]{3,8}$/i,
          /^rgba?\([\d\s,%.]+\)$/i,
          /^[a-z]+$/i,
        ],
        color: [
          /^#[0-9a-f]{3,8}$/i,
          /^rgba?\([\d\s,%.]+\)$/i,
          /^[a-z]+$/i,
        ],
        'font-size': [/^\d+(\.\d+)?(px|pt|em|rem|%)$/],
        'font-style': [/^(italic|normal)$/],
        'font-weight': [/^(bold|bolder|lighter|normal|[1-9]00)$/],
        height: [/^(auto|\d+(\.\d+)?(px|pt|em|rem|%))$/],
        'text-align': [/^(center|justify|left|right)$/],
        'text-decoration': [/^(line-through|none|underline)$/],
        width: [/^(auto|\d+(\.\d+)?(px|pt|em|rem|%))$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  })
}
