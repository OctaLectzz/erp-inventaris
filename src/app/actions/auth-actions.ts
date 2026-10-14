'use server'

import { revalidatePath } from 'next/cache'
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

export interface DemoCredentialsResult {
  success: boolean
  email?: string
  password?: string
  error?: string
}

/**
 * Returns pre-provisioned demo credentials for client form pre-population.
 * Does not execute sign in, ensuring user must manually click submit.
 */
export async function getDemoCredentialsAction(role: UserRole): Promise<DemoCredentialsResult> {
  let email: string | undefined
  let password: string | undefined

  if (role === 'administrator' || role === 'admin_gudang') {
    email = process.env.DEMO_ADMIN_EMAIL
    password = process.env.DEMO_ADMIN_PASSWORD
  } else if (role === 'staff_gudang') {
    email = process.env.DEMO_STAFF_EMAIL
    password = process.env.DEMO_STAFF_PASSWORD
  } else if (role === 'auditor' || role === 'owner') {
    email = process.env.DEMO_OWNER_EMAIL
    password = process.env.DEMO_OWNER_PASSWORD
  }

  if (!email || !password) {
    return {
      success: false,
      error: 'DEMO_NOT_CONFIGURED'
    }
  }

  return {
    success: true,
    email,
    password
  }
}

export interface UpdateProfileResult {
  success: boolean
  error?: string
  message?: string
}

/**
 * Safe Server Action for updating current user's full name.
 * Role cannot be modified (enforced by DB trigger and query restriction).
 */
export async function updateProfileNameAction(fullName: string, currentLocale = 'id'): Promise<UpdateProfileResult> {
  const trimmed = fullName.trim()
  if (trimmed.length < 2 || trimmed.length > 100) {
    return {
      success: false,
      error: 'INVALID_NAME',
      message: 'Name must be between 2 and 100 characters'
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to update your profile'
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: trimmed,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile name:', updateError)
      return {
        success: false,
        error: 'DB_ERROR',
        message: updateError.message
      }
    }

    try {
      revalidatePath(`/${currentLocale}/settings`)
      revalidatePath(`/${currentLocale}/dashboard`)
    } catch {
      // Safe fallback when executed outside Next.js request store (e.g. unit tests)
    }

    return {
      success: true
    }
  } catch (err) {
    console.error('Unhandled error in updateProfileNameAction:', err)
    return {
      success: false,
      error: 'SERVER_ERROR'
    }
  }
}
