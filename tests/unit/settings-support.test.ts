import { beforeEach, describe, expect, it, vi } from 'vitest'

import { updateProfileNameAction } from '@/app/actions/auth-actions'
import * as supabaseServer from '@/lib/supabase/server'

type MockSupabaseClient = Awaited<ReturnType<typeof supabaseServer.createClient>>

describe('Settings — Supported Actions & Role Immutability Security', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should reject profile name updates that are too short (< 2 characters)', async () => {
    const createClientSpy = vi.spyOn(supabaseServer, 'createClient')

    const result = await updateProfileNameAction('A', 'id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_NAME')
    expect(createClientSpy).not.toHaveBeenCalled()
  })

  it('should reject unauthenticated profile updates', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated', status: 401 }
        })
      }
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    const result = await updateProfileNameAction('Valid New Name', 'id')

    expect(result.success).toBe(false)
    expect(result.error).toBe('UNAUTHORIZED')
  })

  it('should update full_name and updated_at while strictly preventing role or email tampering', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    const fromMock = vi.fn().mockReturnValue({ update: updateMock })

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-uuid-123' } },
          error: null
        })
      },
      from: fromMock
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as MockSupabaseClient)

    const result = await updateProfileNameAction('Budi Prakoso', 'id')

    expect(result.success).toBe(true)
    expect(fromMock).toHaveBeenCalledWith('profiles')

    // Verify update payload strictly targets full_name and updated_at
    const updatePayload = updateMock.mock.calls[0][0]
    expect(updatePayload.full_name).toBe('Budi Prakoso')
    expect(updatePayload.updated_at).toBeDefined()
    expect(updatePayload.role).toBeUndefined() // Role modification strictly disallowed
    expect(updatePayload.email).toBeUndefined()

    expect(eqMock).toHaveBeenCalledWith('id', 'test-user-uuid-123')
  })
})
