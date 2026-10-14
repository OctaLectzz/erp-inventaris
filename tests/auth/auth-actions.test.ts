import { beforeEach, describe, expect, it, vi } from 'vitest'

import { signInAction, signInDemoAction } from '@/app/actions/auth-actions'
import * as supabaseServer from '@/lib/supabase/server'

type MockSupabaseClient = Awaited<ReturnType<typeof supabaseServer.createClient>>

describe('Server Actions — signInAction Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should reject invalid input immediately without invoking Supabase', async () => {
    const createClientSpy = vi.spyOn(supabaseServer, 'createClient')

    const result = await signInAction({
      email: 'invalid-email',
      password: '123'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('VALIDATION_ERROR')
    }
    expect(createClientSpy).not.toHaveBeenCalled()
  })

  it('should return generic INVALID_CREDENTIALS on Supabase auth error', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials', status: 400 }
        }),
        signOut: vi.fn()
      }
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    const result = await signInAction({
      email: 'admin@inventra.demo',
      password: 'WrongPassword123'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INVALID_CREDENTIALS')
      expect(result.code).toBe('auth.invalidCredentials')
    }
  })

  it('should revoke session and reject if profile does not exist in database', async () => {
    const signOutMock = vi.fn().mockResolvedValue({})
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-without-profile' } },
          error: null
        }),
        signOut: signOutMock
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Row not found', code: 'PGRST116' }
            })
          })
        })
      })
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    const result = await signInAction({
      email: 'ghost@inventra.demo',
      password: 'ValidPassword123'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INVALID_PROFILE')
      expect(result.code).toBe('auth.unauthorizedProfile')
    }
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it('should revoke session and reject if profile has an unrecognized role', async () => {
    const signOutMock = vi.fn().mockResolvedValue({})
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-with-bad-role' } },
          error: null
        }),
        signOut: signOutMock
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-with-bad-role', role: 'malicious_hacker' },
              error: null
            })
          })
        })
      })
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    const result = await signInAction({
      email: 'badrole@inventra.demo',
      password: 'ValidPassword123'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INVALID_PROFILE')
      expect(result.code).toBe('auth.unauthorizedProfile')
    }
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it('should succeed and sanitize redirect URL when credentials and profile are valid', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'valid-admin-id' } },
          error: null
        })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'valid-admin-id', role: 'admin_gudang' },
              error: null
            })
          })
        })
      })
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    // Scenario A: Safe internal path
    const resultSafe = await signInAction(
      {
        email: 'admin@inventra.demo',
        password: 'ValidPassword123',
        redirectTo: '/id/dashboard'
      },
      'id'
    )

    expect(resultSafe.success).toBe(true)
    if (resultSafe.success) {
      expect(resultSafe.redirectTo).toBe('/id/dashboard')
    }

    // Scenario B: Open-redirect attempt neutralized
    const resultMalicious = await signInAction(
      {
        email: 'admin@inventra.demo',
        password: 'ValidPassword123',
        redirectTo: 'https://attacker.com/steal-session'
      },
      'id'
    )

    expect(resultMalicious.success).toBe(true)
    if (resultMalicious.success) {
      expect(resultMalicious.redirectTo).toBe('/id/dashboard')
    }
  })

  describe('signInDemoAction Multi-Role Support', () => {
    it('should return DEMO_NOT_CONFIGURED when role environment variables are unset', async () => {
      const origAdminEmail = process.env.DEMO_ADMIN_EMAIL
      delete process.env.DEMO_ADMIN_EMAIL

      const result = await signInDemoAction('administrator', 'id')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('DEMO_NOT_CONFIGURED')
      }

      process.env.DEMO_ADMIN_EMAIL = origAdminEmail
    })

    it('should delegate to signInAction with proper credentials for all 5 roles', async () => {
      process.env.DEMO_ADMIN_EMAIL = 'admin@inventra.demo'
      process.env.DEMO_ADMIN_PASSWORD = 'MockPassword123'
      process.env.DEMO_STAFF_EMAIL = 'staff@inventra.demo'
      process.env.DEMO_STAFF_PASSWORD = 'MockPassword123'
      process.env.DEMO_OWNER_EMAIL = 'owner@inventra.demo'
      process.env.DEMO_OWNER_PASSWORD = 'MockPassword123'

      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'mock-user-id' } },
            error: null
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'mock-user-id', role: 'administrator' },
                error: null
              })
            })
          })
        })
      }

      vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

      const roles: Array<'administrator' | 'staff_gudang' | 'auditor' | 'admin_gudang' | 'owner'> = [
        'administrator',
        'staff_gudang',
        'auditor',
        'admin_gudang',
        'owner'
      ]

      for (const role of roles) {
        const result = await signInDemoAction(role, 'id')
        expect(result.success).toBe(true)
      }
    })
  })
})
