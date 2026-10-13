'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

/**
 * Creates a browser-side Supabase client with typed schema.
 * Operates in the browser with anonymous/user credentials using cookies.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined')
  }

  return createBrowserClient<Database>(url, anonKey)
}
