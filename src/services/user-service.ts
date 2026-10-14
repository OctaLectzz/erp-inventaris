import { toUserProfile } from '@/types/auth'

import type { UserProfile } from '@/types/auth'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch all user profiles from public.profiles ordered by creation time.
 */
export async function getUsersList(supabase: SupabaseClient<Database>): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch user profiles: ${error.message}`)
  }

  return (data || []).map(toUserProfile)
}

/**
 * Fetch a single user profile by id.
 */
export async function getUserById(supabase: SupabaseClient<Database>, id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('id, email, full_name, role, created_at, updated_at').eq('id', id).maybeSingle()

  if (error || !data) {
    return null
  }

  return toUserProfile(data)
}
