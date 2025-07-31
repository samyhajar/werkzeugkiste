'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser-client'

// Utility function to clear auth cookies
const clearAuthCookies = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ]

  cookiesToClear.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
  })

  console.log('[SessionBootstrap] Cleared auth cookies:', cookiesToClear)
}

/**
 * Supabase JS reads auth tokens from localStorage in the browser while the
 * server-side helpers read them from cookies. After login, we need to sync
 * the server cookies to the client-side Supabase instance.
 *
 * This component runs once in the browser and triggers auth state refresh.
 */
export default function SessionBootstrap() {
  const syncInProgress = useRef(false)
  const hasRun = useRef(false)
  const supabase = useRef<ReturnType<typeof getBrowserClient> | null>(null)
  const pathname = usePathname()

  const syncAuthState = useCallback(async () => {
    // Prevent duplicate sync operations
    if (syncInProgress.current || hasRun.current || !supabase.current) {
      return
    }

    syncInProgress.current = true
    hasRun.current = true

    try {
      console.log('[SessionBootstrap] Starting auth state sync...')

      // Check for auth cookies
      const cookies = document.cookie.split(';')
      const authCookies = cookies.filter(cookie =>
        cookie.trim().startsWith('sb-') ||
        cookie.trim().startsWith('supabase-auth-token')
      )

      console.log('[SessionBootstrap] Found auth cookies:', authCookies.length)

      if (authCookies.length > 0) {
        // First try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.current.auth.getSession()

        if (sessionError) {
          console.error('[SessionBootstrap] Get session error:', sessionError)
          // Clear invalid cookies on error
          if (sessionError.message.includes('Auth session missing') ||
              sessionError.message.includes('Invalid refresh token') ||
              sessionError.message.includes('refresh_token_not_found')) {
            console.log('[SessionBootstrap] Clearing invalid auth cookies due to session error')
            clearAuthCookies()
          }
        } else if (sessionData.session) {
          console.log('[SessionBootstrap] Session found:', sessionData.session.user?.email || 'no user')
        } else {
          console.log('[SessionBootstrap] No session found, clearing any stale cookies')
          clearAuthCookies()
        }
      } else {
        console.log('[SessionBootstrap] No auth cookies found')
      }
    } catch (error) {
      console.error('[SessionBootstrap] Error syncing auth state:', error)
      // Clear cookies on any error to prevent stuck state
      clearAuthCookies()
    } finally {
      syncInProgress.current = false
    }
  }, [])

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Do not sync auth state on the set-password page
    if (pathname === '/auth/set-password') {
      console.log('[SessionBootstrap] On set-password page, skipping auth sync to allow password update.');
      return;
    }

    // Initialize Supabase client
    supabase.current = getBrowserClient()

    // Run sync on mount with a small delay to avoid conflicts
    const initialTimeout = setTimeout(() => {
      void syncAuthState()
    }, 100)

    return () => {
      clearTimeout(initialTimeout)
      syncInProgress.current = false
    }
  }, [syncAuthState])

  return null
}
