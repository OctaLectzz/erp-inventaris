import { describe, expect, it } from 'vitest'

import enDashboard from '../../messages/en/dashboard.json'
import idDashboard from '../../messages/id/dashboard.json'

describe('Responsive Dashboard & Settings — i18n & Overflow Prevention Contract', () => {
  it('should define all RecentMovementsCard localized table headers', () => {
    const requiredRecentKeys = ['time', 'product', 'type', 'quantity', 'finalStock', 'subtitleCount']

    for (const key of requiredRecentKeys) {
      expect(idDashboard.recentMovements).toHaveProperty(key)
      expect(enDashboard.recentMovements).toHaveProperty(key)
      expect((idDashboard.recentMovements as Record<string, string>)[key].length).toBeGreaterThan(0)
    }
  })

  it('should define all LowStockWatchlist localized table headers', () => {
    const requiredWatchlistKeys = ['sku', 'productName', 'unitPrice', 'remainingStock', 'status', 'criticalBadge']

    for (const key of requiredWatchlistKeys) {
      expect(idDashboard.watchlist).toHaveProperty(key)
      expect(enDashboard.watchlist).toHaveProperty(key)
      expect((idDashboard.watchlist as Record<string, string>)[key].length).toBeGreaterThan(0)
    }
  })

  it('should define all 5 settings submenus and their copy', () => {
    const requiredTabs = ['profile', 'appearance', 'security', 'notifications', 'about']

    for (const tab of requiredTabs) {
      expect(idDashboard.settings.tabs).toHaveProperty(tab)
      expect(enDashboard.settings.tabs).toHaveProperty(tab)
    }

    // Verify profile section keys
    expect(idDashboard.settings.profile).toHaveProperty('fullNameLabel')
    expect(idDashboard.settings.profile).toHaveProperty('roleNotice')

    // Verify appearance section keys
    expect(idDashboard.settings.appearance).toHaveProperty('themeTitle')
    expect(idDashboard.settings.appearance).toHaveProperty('languageTitle')

    // Verify security section keys
    expect(idDashboard.settings.security).toHaveProperty('sessionTitle')
    expect(idDashboard.settings.security).toHaveProperty('guardRls')

    // Verify notifications section has transparent status
    expect(idDashboard.settings.notifications).toHaveProperty('statusBadge')

    // Verify about section has version info
    expect(idDashboard.settings.about).toHaveProperty('appName')
    expect(idDashboard.settings.about).toHaveProperty('version')
  })
})
