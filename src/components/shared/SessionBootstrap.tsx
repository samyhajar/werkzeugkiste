'use client'

import { useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'

/**
 * Supabase JS reads auth tokens from localStorage in the browser while the
 * server-side helpers read them from cookies. After login, we need to sync
 * the server cookies to the client-side Supabase instance.
 *
 * This component runs once in the browser and triggers auth state refresh.
 */
export default function SessionBootstrap() {
    useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const syncAuthState = async () => {
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
      }
    }

    // Run sync on mount
    void syncAuthState()

    // Also run when cookies change (in case login happens in another tab)
    const interval = setInterval(() => {
      if (typeof document === 'undefined') {
        clearInterval(interval)
        return
      }

      const hasAuthCookie = document.cookie.includes('sb-') && document.cookie.includes('auth-token')
      if (hasAuthCookie) {
        clearInterval(interval)
        void syncAuthState()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
