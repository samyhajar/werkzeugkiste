import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date string using date-fns formatDistanceToNow
 * This prevents hydration errors by using consistent date parsing
 */
export function formatDateSafely(
  dateString: string | null | undefined,
  options?: {
    addSuffix?: boolean
    locale?: 'de' | 'en'
  }
): string {
  if (!dateString) return 'Unknown date'

  try {
    const parsedDate = parseISO(dateString)
    if (!isValid(parsedDate)) {
      return 'Invalid date'
    }

    const locale = options?.locale === 'de' ? de : undefined
    return formatDistanceToNow(parsedDate, {
      addSuffix: options?.addSuffix ?? true,
      locale,
    })
  } catch (_error) {
    return 'Invalid date'
  }
}

/**
 * Formats a date in a readable format
 */
export function formatDateReadable(
  dateString: string | null | undefined
): string {
  if (!dateString) return 'Unknown date'

  try {
    const parsedDate = parseISO(dateString)
    if (!isValid(parsedDate)) {
      return 'Invalid date'
    }

    return parsedDate.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_error) {
    return 'Invalid date'
  }
}
