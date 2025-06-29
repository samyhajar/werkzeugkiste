'use client'

import { useEffect } from 'react'

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
    // Supabase cookie names are "sb-<project-ref>-access-token" etc.
    const cookies = document.cookie.split('; ').map((c) => c.split('='))

    const accessPair = cookies.find(([key]) => key.startsWith('sb-') && key.endsWith('-access-token'))
    const refreshPair = cookies.find(([key]) => key.startsWith('sb-') && key.endsWith('-refresh-token'))

    const access = accessPair?.[1]
    const refresh = refreshPair?.[1]

    if (access && refresh) {
      const accessKey = accessPair[0]
      const refreshKey = refreshPair[0]

      // If they aren't already in localStorage copy them once
      if (!localStorage.getItem(accessKey)) {
        localStorage.setItem(accessKey, access)
        localStorage.setItem(refreshKey, refresh)
      }
    }
  }, [])

  return null
}
