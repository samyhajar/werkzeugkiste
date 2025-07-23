'use client'

import { useEffect, useRef, useCallback } from 'react'
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
  const lastSyncTime = useRef<number>(0)
  const hasRun = useRef(false)
  const supabase = useRef(getBrowserClient())

  const syncAuthState = useCallback(async () => {
    // Prevent duplicate sync operations
    if (syncInProgress.current) {
      return
    }

    // Debounce sync operations
    const now = Date.now()
    if (now - lastSyncTime.current < 2000) {
      return
    }

    syncInProgress.current = true
    lastSyncTime.current = now

    try {
      // Check for auth cookies
      const cookies = document.cookie.split(';')
      const authCookies = cookies.filter(cookie =>
        cookie.trim().startsWith('sb-') ||
        cookie.trim().startsWith('supabase-auth-token')
      )

      if (authCookies.length > 0) {
        // Force session refresh if cookies are present
        const { error: refreshError } = await supabase.current.auth.refreshSession()

        if (refreshError) {
          // Try getSession as fallback
          await supabase.current.auth.getSession()
        }
      }
    } catch (error) {
      console.error('[SessionBootstrap] Error syncing auth state:', error)
    } finally {
      syncInProgress.current = false
    }
  }, [])

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    // Only run once per component mount
    if (hasRun.current) {
      return
    }

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
