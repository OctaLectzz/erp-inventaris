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

/**
 * Authorization helpers based on the principle of least privilege.
 * Legacy roles ('admin_gudang' and 'owner') are mapped gracefully for backward compatibility.
 */

/**
 * Checks if a user has full catalog management permissions (create, edit, delete products).
 * Allowed: 'administrator', 'admin_gudang'
 * Denied: 'staff_gudang', 'auditor', 'owner'
 */
export function canManageCatalog(role?: string | null): boolean {
  return role === 'administrator' || role === 'admin_gudang'
}

/**
 * Checks if a user has category management permissions (create, edit, delete categories).
 * Allowed: 'administrator', 'admin_gudang'
 * Denied: 'staff_gudang', 'auditor', 'owner'
 */
export function canManageCategories(role?: string | null): boolean {
  return role === 'administrator' || role === 'admin_gudang'
}

/**
 * Checks if a user has inventory stock mutation permissions (single and multi-item IN/OUT).
 * Allowed: 'administrator', 'staff_gudang', 'admin_gudang'
 * Denied: 'auditor', 'owner'
 */
export function canMutateStock(role?: string | null): boolean {
  return role === 'administrator' || role === 'staff_gudang' || role === 'admin_gudang'
}

/**
 * Checks if a user is an auditor or business owner (read-only audit access).
 * Allowed: 'auditor', 'owner'
 */
export function isAuditorRole(role?: string | null): boolean {
  return role === 'auditor' || role === 'owner'
}

/**
 * Checks if a user can manage system users / administrative settings.
 * Allowed: 'administrator'
 */
export function canManageUsers(role?: string | null): boolean {
  return role === 'administrator'
}
