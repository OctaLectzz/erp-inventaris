import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getDemoCredentialsAction } from '@/app/actions/auth-actions'

describe('Demo Accounts — Auto-Fill Only Contract', () => {
  const originalAdminEmail = process.env.DEMO_ADMIN_EMAIL
  const originalAdminPass = process.env.DEMO_ADMIN_PASSWORD
  const originalOwnerEmail = process.env.DEMO_OWNER_EMAIL
  const originalOwnerPass = process.env.DEMO_OWNER_PASSWORD
  const originalStaffEmail = process.env.DEMO_STAFF_EMAIL
  const originalStaffPass = process.env.DEMO_STAFF_PASSWORD

  beforeEach(() => {
    process.env.DEMO_ADMIN_EMAIL = 'admin@inventra.demo'
    process.env.DEMO_ADMIN_PASSWORD = 'MockAdminPassword123!'
    process.env.DEMO_OWNER_EMAIL = 'owner@inventra.demo'
    process.env.DEMO_OWNER_PASSWORD = 'MockOwnerPassword123!'
    process.env.DEMO_STAFF_EMAIL = 'staff@inventra.demo'
    process.env.DEMO_STAFF_PASSWORD = 'MockStaffPassword123!'
  })

  afterEach(() => {
    process.env.DEMO_ADMIN_EMAIL = originalAdminEmail
    process.env.DEMO_ADMIN_PASSWORD = originalAdminPass
    process.env.DEMO_OWNER_EMAIL = originalOwnerEmail
    process.env.DEMO_OWNER_PASSWORD = originalOwnerPass
    process.env.DEMO_STAFF_EMAIL = originalStaffEmail
    process.env.DEMO_STAFF_PASSWORD = originalStaffPass
  })

  it('should return administrator demo credentials for form filling', async () => {
    const creds = await getDemoCredentialsAction('administrator')

    expect(creds.success).toBe(true)
    expect(creds.email).toBe('admin@inventra.demo')
    expect(creds.password).toBe('MockAdminPassword123!')
  })

  it('should return owner demo credentials for form filling', async () => {
    const creds = await getDemoCredentialsAction('owner')

    expect(creds.success).toBe(true)
    expect(creds.email).toBe('owner@inventra.demo')
    expect(creds.password).toBe('MockOwnerPassword123!')
  })

  it('should return admin_gudang demo credentials for form filling', async () => {
    const creds = await getDemoCredentialsAction('admin_gudang')

    expect(creds.success).toBe(true)
    expect(creds.email).toBe('admingudang@inventra.demo')
    expect(creds.password).toBe('MockAdminPassword123!')
  })

  it('should return staff_gudang demo credentials for form filling', async () => {
    const creds = await getDemoCredentialsAction('staff_gudang')

    expect(creds.success).toBe(true)
    expect(creds.email).toBe('staff@inventra.demo')
    expect(creds.password).toBe('MockStaffPassword123!')
  })

  it('should return auditor demo credentials for form filling', async () => {
    const creds = await getDemoCredentialsAction('auditor')

    expect(creds.success).toBe(true)
    expect(creds.email).toBe('auditor@inventra.demo')
    expect(creds.password).toBe('MockOwnerPassword123!')
  })

  it('should safely return error when credentials are not configured in environment', async () => {
    delete process.env.DEMO_ADMIN_EMAIL
    delete process.env.DEMO_ADMIN_PASSWORD

    const creds = await getDemoCredentialsAction('administrator')

    expect(creds.success).toBe(false)
    expect(creds.error).toBe('DEMO_NOT_CONFIGURED')
    expect(creds.email).toBeUndefined()
    expect(creds.password).toBeUndefined()
  })
})
