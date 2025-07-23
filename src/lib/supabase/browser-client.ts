import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Browser‑side singleton. Import `getBrowserClient()` in any Client Component
 * instead of calling `createBrowserClient()` over and over.
 */
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null

function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Only access document in browser environment
          if (typeof document === 'undefined') {
            return []
          }

          return document.cookie
            .split('; ')
            .filter(cookie => cookie.includes('='))
            .map(cookie => {
              const [name, ...value] = cookie.split('=')
              return {
                name: name.trim(),
                value: decodeURIComponent(value.join('=')),
              }
            })
        },
        setAll(cookiesToSet) {
          // Only access document in browser environment
          if (typeof document === 'undefined') {
            return
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`

            if (options?.path) cookieString += `; Path=${options.path}`
            if (options?.domain) cookieString += `; Domain=${options.domain}`
            if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`
            if (options?.sameSite)
              cookieString += `; SameSite=${options.sameSite}`
            if (options?.secure) cookieString += `; Secure`

            document.cookie = cookieString
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}

export const getBrowserClient = () => {
  // Only create the client in browser environment
  if (typeof window === 'undefined') {
    throw new Error(
      'getBrowserClient() can only be called in browser environment'
    )
  }

  if (!browserClient) {
    browserClient = createClient()
  }

  return browserClient
}
