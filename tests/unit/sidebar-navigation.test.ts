import { describe, expect, it } from 'vitest'

import enSidebar from '../../messages/en/sidebar.json'
import idSidebar from '../../messages/id/sidebar.json'

describe('Sidebar Navigation — 4 Menu Groups & Icon Footer Contract', () => {
  it('should define exactly 4 menu groups (MAIN, MANAGEMENT, REPORTS, OTHER) in both locales', () => {
    const expectedGroups = ['main', 'management', 'reports', 'other']

    expect(Object.keys(idSidebar.groups).sort()).toEqual(expectedGroups.sort())
    expect(Object.keys(enSidebar.groups).sort()).toEqual(expectedGroups.sort())

    expect(idSidebar.groups.main).toBe('MAIN')
    expect(idSidebar.groups.management).toBe('MANAGEMENT')
    expect(idSidebar.groups.reports).toBe('REPORTS')
    expect(idSidebar.groups.other).toBe('OTHER')

    expect(enSidebar.groups.main).toBe('MAIN')
    expect(enSidebar.groups.management).toBe('MANAGEMENT')
    expect(enSidebar.groups.reports).toBe('REPORTS')
    expect(enSidebar.groups.other).toBe('OTHER')
  })

  it('should include all required menu items under items namespace', () => {
    const requiredItems = ['dashboard', 'catalog', 'categories', 'transactions', 'history', 'reports', 'productAnalysis', 'assistant', 'settings']

    for (const item of requiredItems) {
      expect(idSidebar.items).toHaveProperty(item)
      expect(enSidebar.items).toHaveProperty(item)
    }
  })

  it('should define tooltips for icon-only footer controls (theme, language, logout)', () => {
    expect(idSidebar.tooltips).toHaveProperty('theme')
    expect(idSidebar.tooltips).toHaveProperty('language')
    expect(idSidebar.tooltips).toHaveProperty('logout')

    expect(enSidebar.tooltips).toHaveProperty('theme')
    expect(enSidebar.tooltips).toHaveProperty('language')
    expect(enSidebar.tooltips).toHaveProperty('logout')
  })
})
