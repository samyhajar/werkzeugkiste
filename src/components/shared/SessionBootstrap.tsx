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
  const hasRun = useRef(false)
  const supabase = useRef<ReturnType<typeof getBrowserClient> | null>(null)

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
        // Force session refresh if cookies are present
        const { data, error: refreshError } = await supabase.current.auth.refreshSession()

        if (refreshError) {
          console.error('[SessionBootstrap] Refresh error:', refreshError)
          // Try getSession as fallback
          const { data: sessionData, error: sessionError } = await supabase.current.auth.getSession()
          if (sessionError) {
            console.error('[SessionBootstrap] Get session error:', sessionError)
          } else {
            console.log('[SessionBootstrap] Session retrieved:', sessionData.session?.user?.email || 'no session')
          }
        } else {
          console.log('[SessionBootstrap] Session refreshed successfully:', data.session?.user?.email || 'no session')
        }
      } else {
        console.log('[SessionBootstrap] No auth cookies found')
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
