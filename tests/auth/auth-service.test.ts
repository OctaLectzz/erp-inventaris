import { describe, expect, it } from 'vitest'

import { getSafeRedirectUrl } from '@/services/auth-service'
import { isValidRole, toUserProfile } from '@/types/auth'

import type { ProfileRow } from '@/types/database'

describe('Auth Service & Security Utilities', () => {
  describe('Open-Redirect Prevention (getSafeRedirectUrl)', () => {
    it('should return default fallback when targetUrl is undefined or null', () => {
      expect(getSafeRedirectUrl(undefined)).toBe('/dashboard')
      expect(getSafeRedirectUrl(null)).toBe('/dashboard')
      expect(getSafeRedirectUrl('', '/fallback')).toBe('/fallback')
    })

    it('should allow valid relative paths', () => {
      expect(getSafeRedirectUrl('/dashboard')).toBe('/dashboard')
      expect(getSafeRedirectUrl('/id/dashboard')).toBe('/id/dashboard')
      expect(getSafeRedirectUrl('/en/dashboard/inventory')).toBe('/en/dashboard/inventory')
      expect(getSafeRedirectUrl('/dashboard?page=2&status=low_stock')).toBe('/dashboard?page=2&status=low_stock')
    })

    it('should reject protocol-relative URLs (//attacker.com)', () => {
      expect(getSafeRedirectUrl('//attacker.com')).toBe('/dashboard')
      expect(getSafeRedirectUrl('//attacker.com/steal-token')).toBe('/dashboard')
      expect(getSafeRedirectUrl('///attacker.com')).toBe('/dashboard')
    })

    it('should reject absolute URLs with explicit schemes (http, https, javascript, etc.)', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBe('/dashboard')
      expect(getSafeRedirectUrl('http://evil.com/login')).toBe('/dashboard')
      expect(getSafeRedirectUrl('javascript:alert(document.cookie)')).toBe('/dashboard')
      expect(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/dashboard')
      expect(getSafeRedirectUrl('ftp://files.example.com')).toBe('/dashboard')
    })

    it('should reject URLs containing backslashes (\\attacker.com or /\\attacker.com)', () => {
      expect(getSafeRedirectUrl('/\\evil.com')).toBe('/dashboard')
      expect(getSafeRedirectUrl('\\evil.com')).toBe('/dashboard')
      expect(getSafeRedirectUrl('/dashboard\\evil.com')).toBe('/dashboard')
    })

    it('should reject control characters and newlines', () => {
      expect(getSafeRedirectUrl('/dashboard\r\nSet-Cookie: evil=1')).toBe('/dashboard')
      expect(getSafeRedirectUrl('/dashboard\0exploit')).toBe('/dashboard')
    })

    it('should trim whitespace and validate properly', () => {
      expect(getSafeRedirectUrl('   /id/dashboard   ')).toBe('/id/dashboard')
      expect(getSafeRedirectUrl('   https://evil.com   ')).toBe('/dashboard')
    })
  })

  describe('Role Validation (isValidRole)', () => {
    it('should accept valid defined roles', () => {
      expect(isValidRole('admin_gudang')).toBe(true)
      expect(isValidRole('owner')).toBe(true)
    })

    it('should reject arbitrary or unauthorized role strings', () => {
      expect(isValidRole('superadmin')).toBe(false)
      expect(isValidRole('admin')).toBe(false)
      expect(isValidRole('user')).toBe(false)
      expect(isValidRole('guest')).toBe(false)
      expect(isValidRole('')).toBe(false)
    })

    it('should reject non-string types safely', () => {
      expect(isValidRole(null)).toBe(false)
      expect(isValidRole(undefined)).toBe(false)
      expect(isValidRole(123)).toBe(false)
      expect(isValidRole({})).toBe(false)
      expect(isValidRole(['admin_gudang'])).toBe(false)
    })
  })

  describe('Profile Transformation (toUserProfile)', () => {
    it('should correctly transform a database ProfileRow to a clean UserProfile', () => {
      const row: ProfileRow = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@inventra.demo',
        full_name: 'Budi Santoso (Admin Gudang)',
        role: 'admin_gudang',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z'
      }

      const domainProfile = toUserProfile(row)

      expect(domainProfile).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@inventra.demo',
        fullName: 'Budi Santoso (Admin Gudang)',
        role: 'admin_gudang',
        createdAt: '2026-10-13T00:00:00Z',
        updatedAt: '2026-10-13T00:00:00Z'
      })
    })
  })
})
