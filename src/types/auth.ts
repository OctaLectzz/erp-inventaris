import type { ProfileRow } from './database'

/**
 * Valid application user roles.
 * - admin_gudang: Warehouse administrator with full inventory mutation rights.
 * - owner: Business owner with read-only visibility into catalog, history, and metrics.
 */
export type UserRole = 'admin_gudang' | 'owner' | 'administrator' | 'staff_gudang' | 'auditor'

export const USER_ROLES = {
  ADMIN_GUDANG: 'admin_gudang' as UserRole,
  OWNER: 'owner' as UserRole,
  ADMINISTRATOR: 'administrator' as UserRole,
  STAFF_GUDANG: 'staff_gudang' as UserRole,
  AUDITOR: 'auditor' as UserRole
} as const

export const VALID_ROLES: readonly UserRole[] = ['admin_gudang', 'owner', 'administrator', 'staff_gudang', 'auditor'] as const

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.includes(role as UserRole)
}

/**
 * Clean domain representation of a user profile.
 */
export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

/**
 * Transform a raw database profile row into a domain UserProfile.
 */
export function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role as UserRole,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
