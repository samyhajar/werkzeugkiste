'use client'

import { isProtectedImageUrl } from '@/lib/image-protection'
import { useEffect } from 'react'

const imageSelector = 'img, picture, canvas, [role="img"], [data-protect-image]'

function hasImageBackground(element: Element) {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  return getComputedStyle(element).backgroundImage.includes('url(')
}

function isImageTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest(imageSelector)) {
    return true
  }

  let current: Element | null = target

  while (current && current !== document.body) {
    if (hasImageBackground(current)) {
      return true
    }

    current = current.parentElement
  }

  return false
}

function getProtectedImageLink(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null
  }

  const link = target.closest('a')

  if (!(link instanceof HTMLAnchorElement)) {
    return null
  }

  const href = link.getAttribute('href') || link.href
  const downloadName = link.getAttribute('download')

  if (
    link.hasAttribute('data-protected-image-link') ||
    isProtectedImageUrl(href) ||
    isProtectedImageUrl(downloadName)
  ) {
    return link
  }

  return null
}

export default function ImageProtection() {
  useEffect(() => {
    const preventImageAction = (event: Event) => {
      if (isImageTarget(event.target) || getProtectedImageLink(event.target)) {
        event.preventDefault()
      }
    }

    document.addEventListener('contextmenu', preventImageAction, {
      capture: true,
    })
    document.addEventListener('dragstart', preventImageAction, {
      capture: true,
    })
    document.addEventListener('click', preventImageAction, {
      capture: true,
    })
    document.addEventListener('auxclick', preventImageAction, {
      capture: true,
    })

    return () => {
      document.removeEventListener('contextmenu', preventImageAction, {
        capture: true,
      })
      document.removeEventListener('dragstart', preventImageAction, {
        capture: true,
      })
      document.removeEventListener('click', preventImageAction, {
        capture: true,
      })
      document.removeEventListener('auxclick', preventImageAction, {
        capture: true,
      })
    }
  }, [])

  return null
}
