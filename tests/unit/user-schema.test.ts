import { userInputSchema, userUpdateSchema } from '@/schemas/user-schema'
import { describe, expect, it } from 'vitest'

describe('User Schema Validation', () => {
  it('validates correct user input schema', () => {
    const valid = {
      email: 'staff@inventra.demo',
      fullName: 'Budi Warehouse',
      password: 'password123',
      role: 'staff_gudang'
    }

    const res = userInputSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it('rejects invalid email and short password', () => {
    const invalid = {
      email: 'not-an-email',
      fullName: 'A',
      password: '123',
      role: 'staff_gudang'
    }

    const res = userInputSchema.safeParse(invalid)
    expect(res.success).toBe(false)
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path[0])
      expect(paths).toContain('email')
      expect(paths).toContain('fullName')
      expect(paths).toContain('password')
    }
  })

  it('rejects invalid role', () => {
    const invalid = {
      email: 'test@inventra.demo',
      fullName: 'Test User',
      password: 'password123',
      role: 'super_hacker'
    }

    const res = userInputSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })

  it('validates user update with optional empty password', () => {
    const validUpdate = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fullName: 'Updated Name',
      role: 'administrator',
      password: ''
    }

    const res = userUpdateSchema.safeParse(validUpdate)
    expect(res.success).toBe(true)
  })
})
