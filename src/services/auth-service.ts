import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { isValidRole, toUserProfile } from '@/types/auth'

import type { UserProfile, UserRole } from '@/types/auth'
import type { User } from '@supabase/supabase-js'

/**
 * Validates and sanitizes a redirect target URL to prevent open redirect vulnerabilities.
 * Only internal relative paths starting with a single '/' are permitted.
 * Protocol-relative URLs ('//'), URLs with schemes ('https:', 'http:', 'javascript:'),
 * and malformed URLs are safely rejected and defaulted.
 */
export function getSafeRedirectUrl(targetUrl?: string | null, fallback = '/dashboard'): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return fallback
  }

  const trimmed = targetUrl.trim()

  // Must begin with a single '/' and not '//' (protocol-relative) or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }

  // Reject explicit protocols or schemes (e.g. "https://", "javascript:")
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback
  }

  // Reject backslashes which browsers sometimes normalize to forward slashes
  if (trimmed.includes('\\')) {
    return fallback
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback
  }

  return trimmed
}

/**
 * Retrieves the currently authenticated Supabase Auth user.
 * Communicates with the Supabase Auth server securely via the server client.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch {
    return null
  }
}

/**
 * Retrieves the authoritative domain UserProfile from public.profiles table.
 * Role information is ALWAYS derived from the database row, never untrusted client state.
 */
export async function getCurrentUserProfile(): Promise<{ user: User; profile: UserProfile } | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profileRow, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (profileError || !profileRow) {
      return null
    }

    if (!isValidRole(profileRow.role)) {
      return null
    }

    return {
      user,
      profile: toUserProfile(profileRow)
    }
  } catch {
    return null
  }
}

/**
 * Server boundary guard: Enforces that the user is authenticated with a valid profile.
 * If unauthenticated, triggers a Next.js redirect to the localized login page.
 */
export async function requireAuth(locale = 'id', returnPath?: string): Promise<{ user: User; profile: UserProfile }> {
  const authState = await getCurrentUserProfile()

  if (!authState) {
    const searchParams = returnPath ? `?returnUrl=${encodeURIComponent(returnPath)}` : ''
    redirect(`/${locale}/login${searchParams}`)
  }

  return authState
}

/**
 * Role-Based Access Control (RBAC) guard: Enforces authentication and role authorization.
 * If user does not have one of the allowed roles, redirects to the default dashboard.
 */
export async function requireRole(allowedRoles: UserRole[], locale = 'id'): Promise<{ user: User; profile: UserProfile }> {
  const authState = await requireAuth(locale)

  if (!allowedRoles.includes(authState.profile.role)) {
    redirect(`/${locale}/dashboard`)
  }

  return authState
}
