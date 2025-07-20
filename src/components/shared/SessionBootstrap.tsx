'use client'

import { useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'

/**
 * Supabase JS reads auth tokens from localStorage in the browser while the
 * server-side helpers read them from cookies. After a magic-link / OAuth
 * callback we have fresh `sb-*-token` cookies but localStorage is still empty,
 * so the first client render would think the user is signed-out and the UI
 * shows an infinite loading spinner.
 *
 * This component runs once in the browser, copies the cookie values into
 * localStorage (if they are missing) and then does nothing else.
 */
export default function SessionBootstrap() {
  useEffect(() => {
    console.log('[SessionBootstrap] running')

    // Get all cookies and log them for debugging
    const allCookies = document.cookie
    console.log('[SessionBootstrap] raw cookie string:', allCookies)

    if (!allCookies) {
      console.log('[SessionBootstrap] no cookies found')
      return
    }

    // Split cookies properly
    const cookies = allCookies.split(';').map(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=')
      return [name, valueParts.join('=')]
    })

    console.log('[SessionBootstrap] parsed cookies:', cookies.map(([name]) => name))

    // Look for the auth token cookie
    const authCookie = cookies.find(([name]) =>
      name.startsWith('sb-') && name.endsWith('-auth-token')
    )

    if (authCookie) {
      const [cookieName, cookieValue] = authCookie
      console.log('[SessionBootstrap] found auth cookie:', cookieName)

      // Check if it's already in localStorage
      const existingValue = localStorage.getItem(cookieName)
      if (!existingValue) {
        console.log('[SessionBootstrap] copying to localStorage')
        localStorage.setItem(cookieName, cookieValue)
        console.log('[SessionBootstrap] successfully copied')

        // Force refresh the auth state after copying
        const supabase = getBrowserClient()
        console.log('[SessionBootstrap] forcing auth state refresh')
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('[SessionBootstrap] forced refresh result:', !!session)
          if (session) {
            // Trigger a manual auth state change event
            supabase.auth.onAuthStateChange((event, session) => {
              console.log('[SessionBootstrap] triggered auth state change:', event)
            })
          }
        }).catch(error => {
          console.error('[SessionBootstrap] forced refresh error:', error)
        })
      } else {
        console.log('[SessionBootstrap] already in localStorage, but forcing refresh anyway')
        // Even if already in localStorage, force a refresh to ensure AuthContext picks it up
        const supabase = getBrowserClient()

        console.log('[SessionBootstrap] getting current session...')
        supabase.auth.getSession().then(({ data: { session } }: any) => {
          console.log('[SessionBootstrap] getSession result:', session ? 'session exists' : 'no session')
          if (session) {
            console.log('[SessionBootstrap] session found, triggering refresh')
            supabase.auth.refreshSession().then(() => {
              console.log('[SessionBootstrap] refresh completed')
              // Force an auth state change event to wake up AuthContext
              supabase.auth.onAuthStateChange((event, session) => {
                console.log('[SessionBootstrap] forced auth state change:', event)
              })
            }).catch((error: any) => {
              console.error('[SessionBootstrap] refresh error:', error)
            })
          } else {
            console.log('[SessionBootstrap] no session found despite localStorage')
            // Try to force initialize from localStorage
            console.log('[SessionBootstrap] attempting to initialize from localStorage')
            supabase.auth.getUser().then((result: any) => {
              console.log('[SessionBootstrap] getUser result:', result.data?.user ? 'user found' : 'no user')
            }).catch((error: any) => {
              console.error('[SessionBootstrap] getUser error:', error)
            })
          }
        }).catch((error: any) => {
          console.error('[SessionBootstrap] getSession error:', error)
        })
      }
    } else {
      console.log('[SessionBootstrap] no auth cookie found')
    }
  }, [])

  return null
}
