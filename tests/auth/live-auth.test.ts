import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/types/database'

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@inventra.demo'
const adminPassword = process.env.DEMO_ADMIN_PASSWORD || ''
const ownerEmail = process.env.DEMO_OWNER_EMAIL || 'owner@inventra.demo'
const ownerPassword = process.env.DEMO_OWNER_PASSWORD || ''

describe('Live Supabase Auth & RBAC Profile Integration', () => {
  it('should authenticate live Admin Gudang account and verify authoritative profile role', async () => {
    expect(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL must be defined').toBeTruthy()
    expect(anonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined').toBeTruthy()
    expect(adminPassword, 'DEMO_ADMIN_PASSWORD must be defined').toBeTruthy()

    const client = createSupabaseJsClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })

    expect(authError).toBeNull()
    expect(authData.user).toBeDefined()
    expect(authData.session).toBeDefined()
    expect(authData.user?.email).toBe(adminEmail)

    // Fetch authoritative profile record from public.profiles
    const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', authData.user!.id).single()

    expect(profileError).toBeNull()
    expect(profile).toBeDefined()
    expect(profile?.role).toBe('admin_gudang')
    expect(profile?.email).toBe(adminEmail)
    expect(profile?.full_name).toBeTruthy()

    await client.auth.signOut()
  })

  it('should authenticate live Owner account and verify authoritative profile role', async () => {
    expect(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL must be defined').toBeTruthy()
    expect(anonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined').toBeTruthy()
    expect(ownerPassword, 'DEMO_OWNER_PASSWORD must be defined').toBeTruthy()

    const client = createSupabaseJsClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    })

    expect(authError).toBeNull()
    expect(authData.user).toBeDefined()
    expect(authData.session).toBeDefined()
    expect(authData.user?.email).toBe(ownerEmail)

    // Fetch authoritative profile record from public.profiles
    const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', authData.user!.id).single()

    expect(profileError).toBeNull()
    expect(profile).toBeDefined()
    expect(profile?.role).toBe('owner')
    expect(profile?.email).toBe(ownerEmail)
    expect(profile?.full_name).toBeTruthy()

    await client.auth.signOut()
  })

  it('should reject invalid password for known account and protect against session establishment', async () => {
    expect(supabaseUrl).toBeTruthy()
    expect(anonKey).toBeTruthy()

    const client = createSupabaseJsClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: 'DefinitelyWrongPassword999!'
    })

    expect(authError).not.toBeNull()
    expect(authData.user).toBeNull()
    expect(authData.session).toBeNull()
  })

  it('should reject nonexistent email and return generic credential error', async () => {
    expect(supabaseUrl).toBeTruthy()
    expect(anonKey).toBeTruthy()

    const client = createSupabaseJsClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'nonexistent.user@inventra.demo',
      password: 'SomeRandomPassword123!'
    })

    expect(authError).not.toBeNull()
    expect(authData.user).toBeNull()
    expect(authData.session).toBeNull()
  })
})
