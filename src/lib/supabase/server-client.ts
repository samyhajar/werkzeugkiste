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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* Called from a Server Component – safe to ignore. */
          }
        },
      },
    }
  )
}
