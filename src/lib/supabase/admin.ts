import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Initial check for environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Assign to const after checks, ensuring they are strings
const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Declare the type for the singleton instance
type AdminClientType = SupabaseClient<Database>;

let adminClientInstance: AdminClientType | null = null;

/**
 * Creates and returns a Supabase admin client instance.
 * Uses the service_role key; ONLY use on the server-side.
 */
export function createAdminClient(): AdminClientType {
  if (!adminClientInstance) {
    // Use the guaranteed string constants
    adminClientInstance = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  // Use non-null assertion as logic guarantees it's assigned
  return adminClientInstance;
}
