import { vi } from 'vitest'

/**
 * Creates a deterministic, in-memory mock of the Supabase client for unit testing.
 * Allows inspecting calls, verifying query parameters, and simulating errors without network access.
 */
export function createMockSupabaseClient() {
  const selectMock = vi.fn()
  const insertMock = vi.fn()
  const updateMock = vi.fn()
  const deleteMock = vi.fn()
  const eqMock = vi.fn()
  const singleMock = vi.fn()
  const rpcMock = vi.fn()

  const queryBuilder = {
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
    eq: eqMock,
    single: singleMock
  }

  // Setup default chaining returns
  selectMock.mockReturnValue(queryBuilder)
  insertMock.mockReturnValue(queryBuilder)
  updateMock.mockReturnValue(queryBuilder)
  deleteMock.mockReturnValue(queryBuilder)
  eqMock.mockReturnValue(queryBuilder)
  singleMock.mockResolvedValue({ data: null, error: null })

  const fromMock = vi.fn().mockReturnValue(queryBuilder)

  const authMock = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null })
  }

  return {
    from: fromMock,
    rpc: rpcMock,
    auth: authMock,
    _queryBuilder: queryBuilder
  }
}
