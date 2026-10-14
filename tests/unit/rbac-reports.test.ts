import { describe, expect, it } from 'vitest'

import { canManageCatalog, canMutateStock, canViewReports, isAuditorRole } from '@/types/auth'

describe('RBAC Reports Authorization Matrix', () => {
  it('allows all 3 final roles to view reports', () => {
    expect(canViewReports('administrator')).toBe(true)
    expect(canViewReports('staff_gudang')).toBe(true)
    expect(canViewReports('auditor')).toBe(true)
  })

  it('allows legacy roles to view reports for backward compatibility', () => {
    expect(canViewReports('admin_gudang')).toBe(true)
    expect(canViewReports('owner')).toBe(true)
  })

  it('denies anonymous or undefined roles from viewing reports', () => {
    expect(canViewReports(null)).toBe(false)
    expect(canViewReports(undefined)).toBe(false)
    expect(canViewReports('guest')).toBe(false)
  })

  it('enforces that auditor cannot mutate catalog or stock on report pages', () => {
    expect(canManageCatalog('auditor')).toBe(false)
    expect(canMutateStock('auditor')).toBe(false)
    expect(isAuditorRole('auditor')).toBe(true)
  })

  it('enforces that staff_gudang cannot manage catalog on report pages', () => {
    expect(canManageCatalog('staff_gudang')).toBe(false)
    expect(canMutateStock('staff_gudang')).toBe(true)
  })
})
