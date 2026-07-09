import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type PublicContentClient = SupabaseClient<Database>

let publicContentClient: PublicContentClient | null = null

export function createPublicContentClient(): PublicContentClient {
  if (publicContentClient) {
    return publicContentClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    throw new Error(
      'Missing env.SUPABASE_SERVICE_ROLE_KEY or env.NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  publicContentClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return publicContentClient
}
