'use client'

import { useEffect, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'

/**
 * Supabase JS reads auth tokens from localStorage in the browser while the
 * server-side helpers read them from cookies. After login, we need to sync
 * the server cookies to the client-side Supabase instance.
 *
 * This component runs once in the browser and triggers auth state refresh.
 */
export default function SessionBootstrap() {
  const syncInProgress = useRef(false)
  const lastSync = useRef<number>(0)
  const hasRun = useRef(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Only run once per component mount
    if (hasRun.current) {
      return
    }

    const syncAuthState = async () => {
      // Prevent duplicate sync operations
      if (syncInProgress.current) {
        console.log('[SessionBootstrap] Sync already in progress, skipping...')
        return
      }

      // Debounce sync operations
      const now = Date.now()
      if (now - lastSync.current < 2000) {
        console.log('[SessionBootstrap] Debouncing sync operation...')
        return
      }

      syncInProgress.current = true
      lastSync.current = now
      hasRun.current = true

      try {
        const supabase = getBrowserClient()

        console.log('[SessionBootstrap] Checking for auth cookies...')
        const authCookies = document.cookie
          .split('; ')
          .filter(cookie => cookie.includes('sb-') && cookie.includes('auth-token'))

        console.log('[SessionBootstrap] Found auth cookies:', authCookies.length)

        if (authCookies.length > 0) {
          console.log('[SessionBootstrap] Auth cookies present, forcing session refresh...')
          try {
            // Force a refresh to pick up cookies
            await supabase.auth.refreshSession()
            console.log('[SessionBootstrap] Session refresh completed')
          } catch (refreshError) {
            console.log('[SessionBootstrap] Refresh failed, trying getSession:', refreshError)
            await supabase.auth.getSession()
          }
        } else {
          console.log('[SessionBootstrap] No auth cookies found')
        }
      } catch (error) {
        console.error('[SessionBootstrap] Error syncing auth state:', error)
      } finally {
        syncInProgress.current = false
      }
    }

    // Run sync on mount with a small delay to avoid conflicts
    const initialTimeout = setTimeout(() => {
      void syncAuthState()
    }, 100)

    return () => {
      clearTimeout(initialTimeout)
      syncInProgress.current = false
    }
  }, [])

  return null
}
