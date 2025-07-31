import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error(
      'getBrowserClient() can only be called in a browser environment.'
    )
  }

  // Store the client in the window to preserve it across hot reloads in development.
  const w = window as any
  if (!w.browserClient) {
    w.browserClient = createClient()
  }
  return w.browserClient
}
