import 'server-only'

import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

/**
 * Creates a server-only administrative Supabase client using the privileged service role key.
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Bypasses Row-Level Security (RLS) entirely.
 * 2. Must NEVER be exposed to or executed within client components or browser bundles.
 * 3. Exclusively for server-side provisioning, system maintenance, and authorized seed scripts.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase administrative credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
