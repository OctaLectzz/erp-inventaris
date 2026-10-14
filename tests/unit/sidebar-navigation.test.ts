import { describe, expect, it } from 'vitest'

import enSidebar from '../../messages/en/sidebar.json'
import idSidebar from '../../messages/id/sidebar.json'

describe('Sidebar Navigation — Menu Groups & Icon Footer Contract', () => {
  it('should define all required menu groups (main, management, reports, ai, settings, other) in both locales', () => {
    const expectedGroups = ['main', 'management', 'reports', 'ai', 'settings', 'other']

    for (const group of expectedGroups) {
      expect(idSidebar.groups).toHaveProperty(group)
      expect(enSidebar.groups).toHaveProperty(group)
    }

    expect(idSidebar.groups.main).toBe('MAIN')
    expect(idSidebar.groups.management).toBe('MANAGEMENT')
    expect(idSidebar.groups.reports).toBe('REPORTS')
    expect(idSidebar.groups.ai).toBe('ASISTEN AI')
    expect(idSidebar.groups.settings).toBe('PENGATURAN')

    expect(enSidebar.groups.main).toBe('MAIN')
    expect(enSidebar.groups.management).toBe('MANAGEMENT')
    expect(enSidebar.groups.reports).toBe('REPORTS')
    expect(enSidebar.groups.ai).toBe('AI COPILOT')
    expect(enSidebar.groups.settings).toBe('SETTINGS')
  })

  it('should include all required menu items under items namespace', () => {
    const requiredItems = [
      'dashboard',
      'users',
      'catalog',
      'categories',
      'transactions',
      'history',
      'reports',
      'productAnalysis',
      'assistant',
      'aiDraft',
      'aiRefine',
      'aiQa',
      'settings',
      'websiteSettings'
    ]

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
