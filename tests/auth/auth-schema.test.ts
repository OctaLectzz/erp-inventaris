import { describe, expect, it } from 'vitest'

import { loginSchema } from '@/schemas/auth-schema'

describe('Auth Schema Validation (Zod)', () => {
  describe('Valid Credentials', () => {
    it('should validate standard email and password correctly', () => {
      const result = loginSchema.safeParse({
        email: 'admin@inventra.demo',
        password: 'SecurePassword123!'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('admin@inventra.demo')
        expect(result.data.password).toBe('SecurePassword123!')
      }
    })

    it('should trim surrounding whitespace from email', () => {
      const result = loginSchema.safeParse({
        email: '   user@example.com   ',
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('should permit an optional safe redirectTo path', () => {
      const result = loginSchema.safeParse({
        email: 'admin@inventra.demo',
        password: 'ValidPassword123',
        redirectTo: '/id/dashboard'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.redirectTo).toBe('/id/dashboard')
      }
    })
  })

  describe('Invalid Email Cases', () => {
    it('should reject an empty email string', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('emailRequired')
      }
    })

    it('should reject email consisting only of whitespace', () => {
      const result = loginSchema.safeParse({
        email: '    ',
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('emailRequired')
      }
    })

    it('should reject malformed email strings without @ domain', () => {
      const malformedEmails = ['notanemail', 'admin@', '@domain.com', 'user@domain']
      for (const email of malformedEmails) {
        const result = loginSchema.safeParse({
          email,
          password: 'ValidPassword123'
        })
        expect(result.success, `Expected email "${email}" to fail validation`).toBe(false)
      }
    })
  })

  describe('Invalid Password Cases', () => {
    it('should reject an empty password', () => {
      const result = loginSchema.safeParse({
        email: 'admin@inventra.demo',
        password: ''
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('passwordRequired')
      }
    })

    it('should reject passwords shorter than 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'admin@inventra.demo',
        password: '12345'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('passwordMinLength')
      }
    })

    it('should accept passwords with exact length of 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'admin@inventra.demo',
        password: '123456'
      })

      expect(result.success).toBe(true)
    })
  })
})
