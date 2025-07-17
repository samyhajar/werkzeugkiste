import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Browser‑side singleton. Import `getBrowserClient()` in any Client Component
 * instead of calling `createBrowserClient()` over and over.
 */
const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const getBrowserClient = () => browserClient
