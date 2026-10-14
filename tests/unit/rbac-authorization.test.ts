import { describe, expect, it } from 'vitest'

import { canManageCatalog, canManageCategories, canManageUsers, canMutateStock, isAuditorRole, isValidRole, VALID_ROLES } from '@/types/auth'

describe('RBAC Authorization Helpers & Matrix Verification', () => {
  describe('Valid Roles & Definitions', () => {
    it('contains all 3 consolidated roles plus legacy backward compatibility', () => {
      expect(VALID_ROLES).toContain('administrator')
      expect(VALID_ROLES).toContain('staff_gudang')
      expect(VALID_ROLES).toContain('auditor')
      expect(VALID_ROLES).toContain('admin_gudang')
      expect(VALID_ROLES).toContain('owner')
      expect(VALID_ROLES.length).toBe(5)
    })

    it('validates role strings accurately', () => {
      expect(isValidRole('administrator')).toBe(true)
      expect(isValidRole('staff_gudang')).toBe(true)
      expect(isValidRole('auditor')).toBe(true)
      expect(isValidRole('admin_gudang')).toBe(true)
      expect(isValidRole('owner')).toBe(true)
      expect(isValidRole('superadmin')).toBe(false)
      expect(isValidRole(null)).toBe(false)
      expect(isValidRole(undefined)).toBe(false)
    })
  })

  describe('Permission: canManageCatalog', () => {
    it('allows administrator and legacy admin_gudang', () => {
      expect(canManageCatalog('administrator')).toBe(true)
      expect(canManageCatalog('admin_gudang')).toBe(true)
    })

    it('denies staff_gudang, auditor, owner, and unauthenticated actors', () => {
      expect(canManageCatalog('staff_gudang')).toBe(false)
      expect(canManageCatalog('auditor')).toBe(false)
      expect(canManageCatalog('owner')).toBe(false)
      expect(canManageCatalog(null)).toBe(false)
      expect(canManageCatalog(undefined)).toBe(false)
    })
  })

  describe('Permission: canManageCategories', () => {
    it('allows administrator and legacy admin_gudang', () => {
      expect(canManageCategories('administrator')).toBe(true)
      expect(canManageCategories('admin_gudang')).toBe(true)
    })

    it('denies staff_gudang, auditor, and owner', () => {
      expect(canManageCategories('staff_gudang')).toBe(false)
      expect(canManageCategories('auditor')).toBe(false)
      expect(canManageCategories('owner')).toBe(false)
    })
  })

  describe('Permission: canMutateStock (Single and Multi-Item IN/OUT)', () => {
    it('allows administrator, staff_gudang, and legacy admin_gudang', () => {
      expect(canMutateStock('administrator')).toBe(true)
      expect(canMutateStock('staff_gudang')).toBe(true)
      expect(canMutateStock('admin_gudang')).toBe(true)
    })

    it('strictly denies auditor, owner, and unauthenticated callers', () => {
      expect(canMutateStock('auditor')).toBe(false)
      expect(canMutateStock('owner')).toBe(false)
      expect(canMutateStock('')).toBe(false)
      expect(canMutateStock(null)).toBe(false)
    })
  })

  describe('Permission: isAuditorRole', () => {
    it('identifies auditor and owner roles', () => {
      expect(isAuditorRole('auditor')).toBe(true)
      expect(isAuditorRole('owner')).toBe(true)
      expect(isAuditorRole('administrator')).toBe(false)
      expect(isAuditorRole('staff_gudang')).toBe(false)
    })
  })

  describe('Permission: canManageUsers', () => {
    it('strictly allows only administrator', () => {
      expect(canManageUsers('administrator')).toBe(true)
      expect(canManageUsers('staff_gudang')).toBe(false)
      expect(canManageUsers('auditor')).toBe(false)
      expect(canManageUsers('owner')).toBe(false)
      expect(canManageUsers('admin_gudang')).toBe(false)
    })
  })
})
