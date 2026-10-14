import { describe, expect, it } from 'vitest'

import { getSidebarMenuGroups } from '@/components/shared/sidebar-nav-items'

import type { UserRole } from '@/types/auth'

describe('RBAC Menu Filtering in getSidebarMenuGroups', () => {
  const mockTranslations = (key: string) => key

  function getAllItems(role?: UserRole) {
    const groups = getSidebarMenuGroups({
      locale: 'id',
      pathname: '/id/dashboard',
      tSidebar: mockTranslations as unknown as (key: string) => string,
      role
    })
    return groups.flatMap((g) => g.items)
  }

  it('restricts admin_gudang and staff_gudang from seeing Reports, Product Analysis, AI QA, and Users', () => {
    for (const role of ['admin_gudang', 'staff_gudang'] as UserRole[]) {
      const items = getAllItems(role)
      const hrefs = items.map((i) => i.href)

      // Forbidden for warehouse staff/admin
      expect(hrefs).not.toContain('/id/reports')
      expect(hrefs).not.toContain('/id/reports/products')
      expect(hrefs).not.toContain('/id/assistant/qa')
      expect(hrefs).not.toContain('/id/users')
      expect(hrefs).not.toContain('/id/settings/website')

      // Permitted for warehouse staff/admin
      expect(hrefs).toContain('/id/dashboard')
      expect(hrefs).toContain('/id/inventory')
      expect(hrefs).toContain('/id/categories')
      expect(hrefs).toContain('/id/transactions')
      expect(hrefs).toContain('/id/movements')
      expect(hrefs).toContain('/id/assistant/draft')
      expect(hrefs).toContain('/id/assistant/refine')
    }
  })

  it('restricts auditor from operational transactions, user management, and AI draft/refine', () => {
    const items = getAllItems('auditor')
    const hrefs = items.map((i) => i.href)

    // Auditor can view reports and ask questions
    expect(hrefs).toContain('/id/dashboard')
    expect(hrefs).toContain('/id/inventory')
    expect(hrefs).toContain('/id/movements')
    expect(hrefs).toContain('/id/reports')
    expect(hrefs).toContain('/id/reports/products')
    expect(hrefs).toContain('/id/assistant/qa')

    // Auditor cannot perform operational stock mutations or admin tasks
    expect(hrefs).not.toContain('/id/transactions')
    expect(hrefs).not.toContain('/id/assistant/draft')
    expect(hrefs).not.toContain('/id/assistant/refine')
    expect(hrefs).not.toContain('/id/users')
    expect(hrefs).not.toContain('/id/settings/website')
  })

  it('grants full management and execution access to administrator', () => {
    const items = getAllItems('administrator')
    const hrefs = items.map((i) => i.href)

    expect(hrefs).toContain('/id/dashboard')
    expect(hrefs).toContain('/id/inventory')
    expect(hrefs).toContain('/id/categories')
    expect(hrefs).toContain('/id/users')
    expect(hrefs).toContain('/id/transactions')
    expect(hrefs).toContain('/id/movements')
    expect(hrefs).toContain('/id/reports')
    expect(hrefs).toContain('/id/reports/products')
    expect(hrefs).toContain('/id/assistant/draft')
    expect(hrefs).toContain('/id/assistant/refine')
    expect(hrefs).toContain('/id/assistant/qa')
    expect(hrefs).toContain('/id/settings/website')
  })

  it('grants user management, website settings, and analytics to owner without operational stock mutations', () => {
    const items = getAllItems('owner')
    const hrefs = items.map((i) => i.href)

    expect(hrefs).toContain('/id/dashboard')
    expect(hrefs).toContain('/id/inventory')
    expect(hrefs).toContain('/id/categories')
    expect(hrefs).toContain('/id/users')
    expect(hrefs).not.toContain('/id/transactions') // Owner is executive oversight, not floor mutation operator
    expect(hrefs).toContain('/id/movements')
    expect(hrefs).toContain('/id/reports')
    expect(hrefs).toContain('/id/reports/products')
    expect(hrefs).toContain('/id/assistant/qa')
    expect(hrefs).toContain('/id/settings/website')
  })
})
