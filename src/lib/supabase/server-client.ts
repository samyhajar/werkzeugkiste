import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Server‑side Supabase client with cookie support.
 * Note: In some Next.js versions `cookies()` is asynchronous, returning a
 * `Promise<ReadonlyRequestCookies>`.  Therefore this helper is **async** and
 * callers must `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Check if we're in a context that allows cookie modification
            // This will throw an error if we're not in a Server Action or Route Handler
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure cookies persist and are accessible to client
              const cookieOptions = {
                ...options,
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: false, // Allow client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                path: '/',
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // Silently ignore cookie setting errors when not in proper context
            // This is expected behavior when called from Server Components
            // The client-side authentication will handle session persistence
          }
        },
      },
      auth: {
        flowType: 'pkce',
      },
    }
  )
}
