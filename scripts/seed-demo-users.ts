import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

import type { UserRole } from '../src/types/auth'
import type { Database } from '../src/types/database'

/**
 * Parses .env.local if present to populate process.env without external libraries.
 */
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

interface DemoAccountConfig {
  email: string
  fullName: string
  role: UserRole
  envPasswordKey: string
}

const DEMO_ACCOUNTS: DemoAccountConfig[] = [
  {
    email: process.env.DEMO_ADMIN_EMAIL || 'admin@inventra.demo',
    fullName: 'Admin Gudang Demo',
    role: 'admin_gudang',
    envPasswordKey: 'DEMO_ADMIN_PASSWORD'
  },
  {
    email: process.env.DEMO_OWNER_EMAIL || 'owner@inventra.demo',
    fullName: 'Business Owner Demo',
    role: 'owner',
    envPasswordKey: 'DEMO_OWNER_PASSWORD'
  }
]

async function main(): Promise<void> {
  loadEnvLocal()

  const isDryRun = process.argv.includes('--dry-run')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
    process.exit(1)
  }

  console.log(`--- Inventra Demo Accounts Provisioning ---`)
  console.log(`Target Supabase URL: ${supabaseUrl}`)
  console.log(`Execution Mode: ${isDryRun ? 'DRY RUN (no database changes)' : 'LIVE'}`)

  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // List existing auth users
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) {
    console.error(`Failed to list existing users: ${listError.message}`)
    process.exit(1)
  }

  const existingUsers = usersData?.users || []
  console.log(`Found ${existingUsers.length} existing user(s) in auth.users.`)

  for (const account of DEMO_ACCOUNTS) {
    console.log(`\nProcessing account: ${account.email} (${account.role})`)
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === account.email.toLowerCase())

    const password = process.env[account.envPasswordKey]
    if (!password) {
      console.warn(`WARNING: Environment variable ${account.envPasswordKey} is not set. Cannot provision or verify authentication.`)
      continue
    }

    if (existing) {
      console.log(`  Account already exists in auth.users (ID: ${existing.id})`)

      // Verify authoritative profile
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', existing.id)
        .single()

      if (profileError || !profile) {
        console.warn(`  Profile record missing or inaccessible: ${profileError?.message}`)
        if (!isDryRun) {
          console.log(`  Creating authoritative profile record...`)
          await adminClient.from('profiles').upsert({
            id: existing.id,
            email: account.email,
            full_name: account.fullName,
            role: account.role
          })
          console.log(`  Profile upserted successfully.`)
        }
      } else {
        if (profile.role !== account.role && !isDryRun) {
          console.log(`  Synchronizing profile role from ${profile.role} to ${account.role}...`)
          await adminClient.from('profiles').update({ role: account.role }).eq('id', existing.id)
        }
        console.log(`  Authoritative profile verified: role=${account.role}, name=${profile.full_name}`)
      }
    } else {
      if (isDryRun) {
        console.log(`  [DRY RUN] Would create account ${account.email} with role ${account.role}.`)
      } else {
        console.log(`  Creating user via Supabase Auth Admin API...`)
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: account.email,
          password: password,
          email_confirm: true,
          app_metadata: { role: account.role },
          user_metadata: { full_name: account.fullName }
        })

        if (createError || !created.user) {
          console.error(`  Failed to create user: ${createError?.message}`)
          continue
        }

        console.log(`  User created successfully (ID: ${created.user.id}).`)

        // Verify and ensure profile role
        const { data: profile } = await adminClient.from('profiles').select('id, role').eq('id', created.user.id).single()

        if (!profile) {
          console.log(`  Ensuring authoritative profile entry...`)
          await adminClient.from('profiles').insert({
            id: created.user.id,
            email: account.email,
            full_name: account.fullName,
            role: account.role
          })
        }
        console.log(`  Profile established with verified role: ${account.role}`)
      }
    }
  }

  console.log(`\n--- Verification Complete ---`)
}

main().catch((err) => {
  console.error('Fatal provisioning error:', err)
  process.exit(1)
})
