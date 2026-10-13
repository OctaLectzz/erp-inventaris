import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import type { Database } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Updates and refreshes the Supabase session in middleware/proxy.
 * Accepts an optional existing NextResponse (such as one produced by next-intl)
 * so that headers, rewrites, redirects, and cookies are preserved.
 */
export async function updateSession(request: NextRequest, response?: NextResponse): Promise<{ response: NextResponse; user: User | null }> {
  const supabaseResponse = response ?? NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // If Supabase environment variables are missing, do not bypass auth; return null user.
    return { response: supabaseResponse, user: null }
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      }
    }
  })

  // IMPORTANT: Do NOT execute code between createServerClient and getUser().
  // Using getUser() authenticates the user by querying Supabase Auth server.
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
