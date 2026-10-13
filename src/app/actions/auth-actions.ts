'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/schemas/auth-schema'
import { getSafeRedirectUrl } from '@/services/auth-service'
import { isValidRole } from '@/types/auth'

import type { AuthActionResult, LoginInput } from '@/schemas/auth-schema'
import type { UserRole } from '@/types/auth'

/**
 * Server Action for authenticating users via Supabase Auth with server-enforced validation,
 * generic safe error responses (no account enumeration), and authoritative role checks.
 */
export async function signInAction(input: LoginInput, currentLocale = 'id'): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      code: parsed.error.issues[0]?.message || 'invalidInput'
    }
  }

  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    })

    if (authError || !authData.user) {
      // Return generic credential error to prevent account enumeration
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        code: 'auth.invalidCredentials'
      }
    }

    // Verify that an authoritative profile row exists in public.profiles
    const { data: profileRow, error: profileError } = await supabase.from('profiles').select('id, role').eq('id', authData.user.id).single()

    if (profileError || !profileRow || !isValidRole(profileRow.role)) {
      // Revoke the session immediately if no authoritative profile or invalid role
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'INVALID_PROFILE',
        code: 'auth.unauthorizedProfile'
      }
    }

    // Sanitize destination to prevent open redirect vulnerabilities
    const fallbackPath = `/${currentLocale}/dashboard`
    const targetUrl = parsed.data.redirectTo ? getSafeRedirectUrl(parsed.data.redirectTo, fallbackPath) : fallbackPath

    return {
      success: true,
      redirectTo: targetUrl
    }
  } catch (err) {
    console.error('Unhandled authentication error in signInAction:', err)
    return {
      success: false,
      error: 'SERVER_ERROR',
      code: 'auth.genericError'
    }
  }
}

/**
 * Evaluator convenience action: Authenticates pre-provisioned demo accounts securely
 * on the server without ever leaking passwords to client-side code or HTML bundles.
 */
export async function signInDemoAction(role: UserRole, currentLocale = 'id'): Promise<AuthActionResult> {
  const email = role === 'admin_gudang' ? process.env.DEMO_ADMIN_EMAIL : process.env.DEMO_OWNER_EMAIL
  const password = role === 'admin_gudang' ? process.env.DEMO_ADMIN_PASSWORD : process.env.DEMO_OWNER_PASSWORD

  if (!email || !password) {
    return {
      success: false,
      error: 'DEMO_NOT_CONFIGURED',
      code: 'auth.genericError'
    }
  }

  return signInAction(
    {
      email,
      password,
      redirectTo: `/${currentLocale}/dashboard`
    },
    currentLocale
  )
}

/**
 * Server Action for signing out and invalidating the active session cookies.
 */
export async function signOutAction(currentLocale = 'id'): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Error during signOutAction:', err)
  }

  redirect(`/${currentLocale}/login`)
}
