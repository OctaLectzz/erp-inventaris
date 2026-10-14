'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { userInputSchema, userUpdateSchema } from '@/schemas/user-schema'
import { requireAuth } from '@/services/auth-service'
import { canManageUsers, toUserProfile } from '@/types/auth'

import type { UserInput, UserUpdate } from '@/schemas/user-schema'
import type { UserProfile } from '@/types/auth'

export type UserActionResult<T = UserProfile> =
  { success: true; data?: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

export async function createUserAction(input: UserInput, locale = 'id'): Promise<UserActionResult> {
  let currentProfile
  try {
    const authContext = await requireAuth(locale)
    currentProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!canManageUsers(currentProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya Administrator atau Pemilik Usaha yang memiliki izin untuk menambah pengguna.'
    }
  }

  const parsed = userInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Data pengguna tidak valid. Silakan periksa kolom formulir.',
      fieldErrors
    }
  }

  const { email, password, fullName, role } = parsed.data

  try {
    const admin = createAdminClient()

    // Check duplicate email in profiles
    const { data: existingProfile } = await admin.from('profiles').select('id').ilike('email', email).maybeSingle()

    if (existingProfile) {
      return {
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'Pengguna dengan alamat email ini sudah terdaftar di sistem.',
        fieldErrors: { email: 'Email sudah digunakan' }
      }
    }

    // Provision auth user via admin client
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    })

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'AUTH_PROVISION_ERROR',
        message: authError?.message || 'Gagal membuat kredensial akun pengguna.'
      }
    }

    // Upsert profile in public.profiles
    const { data: profileRow, error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError || !profileRow) {
      return {
        success: false,
        error: 'PROFILE_INSERT_ERROR',
        message: profileError?.message || 'Akun auth dibuat namun gagal menyimpan data profil.'
      }
    }

    revalidatePath(`/${locale}/users`, 'page')
    return { success: true, data: toUserProfile(profileRow) }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat pengguna.'
    return { success: false, error: 'INTERNAL_ERROR', message }
  }
}

export async function updateUserAction(input: UserUpdate, locale = 'id'): Promise<UserActionResult> {
  let currentProfile
  try {
    const authContext = await requireAuth(locale)
    currentProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!canManageUsers(currentProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya Administrator atau Pemilik Usaha yang memiliki izin untuk mengubah pengguna.'
    }
  }

  const parsed = userUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Data pengguna tidak valid. Silakan periksa kolom formulir.',
      fieldErrors
    }
  }

  const { id, fullName, role, password } = parsed.data

  try {
    const admin = createAdminClient()

    // Prevent demoting the last admin/owner
    if (role !== 'administrator' && role !== 'owner') {
      const { data: admins } = await admin.from('profiles').select('id, role').in('role', ['administrator', 'owner'])

      if (admins && admins.length <= 1 && admins.some((u) => u.id === id)) {
        return {
          success: false,
          error: 'LAST_ADMIN_DEMOTION',
          message: 'Tidak dapat mengubah peran administrator/pemilik terakhir. Sistem harus memiliki minimal satu pengelola.'
        }
      }
    }

    // Update public.profiles
    const { data: updatedProfile, error: profileError } = await admin
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (profileError || !updatedProfile) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: profileError?.message || 'Gagal memperbarui profil pengguna.'
      }
    }

    // Update auth metadata & optional password
    const authUpdatePayload: { user_metadata: { full_name: string; role: string }; password?: string } = {
      user_metadata: { full_name: fullName, role }
    }
    if (password && password.length >= 6) {
      authUpdatePayload.password = password
    }

    await admin.auth.admin.updateUserById(id, authUpdatePayload)

    revalidatePath(`/${locale}/users`, 'page')
    return { success: true, data: toUserProfile(updatedProfile) }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui pengguna.'
    return { success: false, error: 'INTERNAL_ERROR', message }
  }
}

export async function deleteUserAction(targetUserId: string, locale = 'id'): Promise<UserActionResult<void>> {
  let currentProfile
  try {
    const authContext = await requireAuth(locale)
    currentProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir.'
    }
  }

  if (!canManageUsers(currentProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya Administrator atau Pemilik Usaha yang dapat menghapus pengguna.'
    }
  }

  // Self deletion prevention
  if (currentProfile.id === targetUserId) {
    return {
      success: false,
      error: 'CANNOT_DELETE_SELF',
      message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.'
    }
  }

  try {
    const admin = createAdminClient()

    // Prevent deleting last admin or owner
    const { data: admins } = await admin.from('profiles').select('id, role').in('role', ['administrator', 'owner'])

    if (admins && admins.length <= 1 && admins.some((u) => u.id === targetUserId)) {
      return {
        success: false,
        error: 'LAST_ADMIN_DELETE',
        message: 'Tidak dapat menghapus akun administrator/pemilik terakhir sistem.'
      }
    }

    // Check if user has recorded stock movements (audit preservation)
    const { count: movementCount } = await admin.from('stock_movements').select('id', { count: 'exact', head: true }).eq('user_id', targetUserId)

    if (movementCount && movementCount > 0) {
      return {
        success: false,
        error: 'AUDIT_LEDGER_RESTRICT',
        message: `Pengguna ini telah mencatat ${movementCount} riwayat mutasi stok. Demi integritas audit ERP, akun ini tidak dapat dihapus.`
      }
    }

    // Delete profile and auth user
    await admin.from('profiles').delete().eq('id', targetUserId)
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(targetUserId)

    if (deleteAuthError) {
      return {
        success: false,
        error: 'AUTH_DELETE_ERROR',
        message: deleteAuthError.message
      }
    }

    revalidatePath(`/${locale}/users`, 'page')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus pengguna.'
    return { success: false, error: 'INTERNAL_ERROR', message }
  }
}
