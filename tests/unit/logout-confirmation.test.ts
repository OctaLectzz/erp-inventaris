import { describe, expect, it } from 'vitest'

import enAuth from '../../messages/en/auth.json'
import idAuth from '../../messages/id/auth.json'

describe('Logout — Confirmation Dialog Contract', () => {
  it('should define all confirmation dialog copy in both id and en', () => {
    const requiredKeys = ['button', 'confirmTitle', 'confirmDesc', 'cancel', 'confirm', 'signingOut']

    for (const key of requiredKeys) {
      expect(idAuth.logout).toHaveProperty(key)
      expect(enAuth.logout).toHaveProperty(key)

      expect((idAuth.logout as Record<string, string>)[key].length).toBeGreaterThan(0)
      expect((enAuth.logout as Record<string, string>)[key].length).toBeGreaterThan(0)
    }
  })

  it('should have semantically sound confirmation copy in Indonesian', () => {
    expect(idAuth.logout.confirmTitle).toBe('Konfirmasi Keluar')
    expect(idAuth.logout.cancel).toBe('Batal')
    expect(idAuth.logout.confirm).toBe('Ya, Keluar')
  })

  it('should have semantically sound confirmation copy in English', () => {
    expect(enAuth.logout.confirmTitle).toBe('Confirm Logout')
    expect(enAuth.logout.cancel).toBe('Cancel')
    expect(enAuth.logout.confirm).toBe('Yes, Log Out')
  })
})
