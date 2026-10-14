import { describe, expect, it, vi } from 'vitest'

import { syncDummyJsonCatalogAction } from '@/app/actions/system-actions'

import type { UserProfile } from '@/types/auth'
import type { User } from '@supabase/supabase-js'

const mockAdminUser = { id: 'mock-admin-id' } as unknown as User
const mockAdminProfile: UserProfile = {
  id: 'mock-admin-id',
  email: 'admin@inventra.demo',
  fullName: 'Administrator Inventra',
  role: 'administrator',
  createdAt: '2026-10-15T00:00:00Z',
  updatedAt: '2026-10-15T00:00:00Z'
}

const mockStaffUser = { id: 'mock-staff-id' } as unknown as User
const mockStaffProfile: UserProfile = {
  id: 'mock-staff-id',
  email: 'staff@inventra.demo',
  fullName: 'Staf Gudang',
  role: 'staff_gudang',
  createdAt: '2026-10-15T00:00:00Z',
  updatedAt: '2026-10-15T00:00:00Z'
}

vi.mock('@/services/auth-service', () => ({
  requireAuth: vi.fn(async () => ({
    user: mockAdminUser,
    profile: mockAdminProfile
  }))
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({}))
}))

vi.mock('@/services/catalog-sync', () => ({
  syncCatalogFromDummyJson: vi.fn(async () => ({
    totalFetched: 30,
    insertedCount: 5,
    updatedCount: 25,
    skippedCount: 0,
    errors: []
  }))
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('System Actions Unit Tests', () => {
  it('allows administrator to synchronize DummyJSON catalog', async () => {
    const result = await syncDummyJsonCatalogAction('id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.totalFetched).toBe(30)
      expect(result.message).toContain('berhasil')
    }
  })

  it('rejects non-administrator roles from synchronizing catalog', async () => {
    const { requireAuth } = await import('@/services/auth-service')
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: mockStaffUser,
      profile: mockStaffProfile
    })

    const result = await syncDummyJsonCatalogAction('id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('FORBIDDEN')
    }
  })
})
