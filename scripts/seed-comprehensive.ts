import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

import type { Database } from '../src/types/database'

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

async function main(): Promise<void> {
  loadEnvLocal()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Supabase credentials not found in environment.')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  console.log('=== SEEDING COMPREHENSIVE INVENTRA ERP DATA ===')

  // 1. Seed / Verify Demo Users
  console.log('\n[1/5] Provisioning Demo Accounts & Profiles...')
  const demoAccounts = [
    // 1. Administrator Sistem
    {
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@inventra.demo',
      password: process.env.DEMO_ADMIN_PASSWORD || 'Admin123!Secure',
      fullName: 'Budi Wicaksono (Administrator Sistem)',
      role: 'administrator'
    },
    {
      email: 'dewi.admin@inventra.demo',
      password: process.env.DEMO_ADMIN_PASSWORD || 'Admin123!Secure',
      fullName: 'Dewi Suryani (IT Operations Administrator)',
      role: 'administrator'
    },
    // 2. Pemilik Usaha (Owner)
    {
      email: process.env.DEMO_OWNER_EMAIL || 'owner@inventra.demo',
      password: process.env.DEMO_OWNER_PASSWORD || 'Owner123!Secure',
      fullName: 'Hendro Syailendra (Direktur Utama / Owner)',
      role: 'owner'
    },
    {
      email: 'maya.owner@inventra.demo',
      password: process.env.DEMO_OWNER_PASSWORD || 'Owner123!Secure',
      fullName: 'Maya Putri (Dewan Komisaris / Co-Owner)',
      role: 'owner'
    },
    // 3. Staf Gudang (Operational)
    {
      email: process.env.DEMO_STAFF_EMAIL || 'staff@inventra.demo',
      password: process.env.DEMO_STAFF_PASSWORD || 'Staff123!Secure',
      fullName: 'Agus Setiawan (Koordinator Staf Gudang)',
      role: 'staff_gudang'
    },
    {
      email: 'rian.staff@inventra.demo',
      password: process.env.DEMO_STAFF_PASSWORD || 'Staff123!Secure',
      fullName: 'Rian Hidayat (Staf Penerimaan & Inbound)',
      role: 'staff_gudang'
    },
    {
      email: 'siti.staff@inventra.demo',
      password: process.env.DEMO_STAFF_PASSWORD || 'Staff123!Secure',
      fullName: 'Siti Aminah (Staf Distribusi & Outbound)',
      role: 'staff_gudang'
    },
    // 4. Auditor & Pengawas
    {
      email: 'auditor@inventra.demo',
      password: process.env.DEMO_OWNER_PASSWORD || 'Owner123!Secure',
      fullName: 'Bambang Susanto (Internal Auditor Inventaris)',
      role: 'auditor'
    },
    {
      email: 'linda.auditor@inventra.demo',
      password: process.env.DEMO_OWNER_PASSWORD || 'Owner123!Secure',
      fullName: 'Linda Permata (Auditor Eksternal Keuangan)',
      role: 'auditor'
    },
    // 5. Admin Gudang (Legacy / Floor Supervisor)
    {
      email: 'admingudang@inventra.demo',
      password: process.env.DEMO_ADMIN_PASSWORD || 'Admin123!Secure',
      fullName: 'Rudy Pratama (Supervisor Admin Gudang)',
      role: 'admin_gudang'
    }
  ]

  const userIds: Record<string, string> = {}

  for (const acc of demoAccounts) {
    const { data: listData } = await supabase.auth.admin.listUsers()
    let userId = listData?.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase())?.id

    if (!userId) {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, role: acc.role }
      })
      if (createError || !createData.user) {
        console.warn(`  Failed to create auth user ${acc.email}:`, createError?.message)
        continue
      }
      userId = createData.user.id
    } else {
      await supabase.auth.admin.updateUserById(userId, {
        password: acc.password,
        user_metadata: { full_name: acc.fullName, role: acc.role }
      })
    }

    userIds[acc.role] = userId
    await supabase.from('profiles').upsert({
      id: userId,
      email: acc.email,
      full_name: acc.fullName,
      role: acc.role,
      updated_at: new Date().toISOString()
    })
    console.log(`  ✓ ${acc.role.padEnd(14)}: ${acc.email} (${userId})`)
  }

  const staffUserId = userIds['staff_gudang'] || userIds['administrator']

  // 2. Seed / Upsert Categories
  console.log('\n[2/5] Seeding Core Product Categories...')
  const categoriesData = [
    { name: 'Minyak Atsiri', slug: 'minyak-atsiri', description: 'Ekstrak murni minyak atsiri sulingan lokal berkualitas ekspor' },
    { name: 'Wewangian', slug: 'wewangian', description: 'Formulasi bibit parfum dan konsentrat aroma premium' },
    { name: 'Perawatan Diri', slug: 'perawatan-diri', description: 'Produk personal care alami berbahan dasar herbal' },
    { name: 'Bahan Baku', slug: 'bahan-baku', description: 'Bahan dasar pelarut, stabilizer, dan aditif kimia kosmetik' },
    { name: 'Kemasan & Wadah', slug: 'kemasan-wadah', description: 'Botol kaca dropper, kaleng aluminium, dan kardus protektif' }
  ]

  const categoryMap: Record<string, string> = {}
  for (const cat of categoriesData) {
    const { data: upsertedCat, error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' }).select('id, name').single()

    if (!error && upsertedCat) {
      categoryMap[cat.name] = upsertedCat.id
      console.log(`  ✓ Kategori: ${cat.name} (${upsertedCat.id})`)
    }
  }

  // 3. Seed Realistic Products
  console.log('\n[3/5] Seeding Realistic Products...')
  const initialProducts = [
    {
      sku: 'ATS-NLM-050',
      name: 'Minyak Nilam Patchouli Aceh 50ml',
      category: 'Minyak Atsiri',
      category_id: categoryMap['Minyak Atsiri'],
      unit: 'btl',
      price: 245000,
      stock: 45,
      description: 'Minyak nilam super Grade A asal Aceh dengan kadar patchouli alcohol > 32%.'
    },
    {
      sku: 'ATS-PLA-100',
      name: 'Minyak Pala Nutmeg Banda 100ml',
      category: 'Minyak Atsiri',
      category_id: categoryMap['Minyak Atsiri'],
      unit: 'btl',
      price: 320000,
      stock: 30,
      description: 'Penyulingan biji pala kepulauan Banda, aroma rempah hangat khas.'
    },
    {
      sku: 'ATS-SRH-250',
      name: 'Minyak Sereh Wangi Citronella 250ml',
      category: 'Minyak Atsiri',
      category_id: categoryMap['Minyak Atsiri'],
      unit: 'btl',
      price: 185000,
      stock: 80,
      description: 'Minyak serai wangi Jawa murni untuk formulasi antinyamuk dan aromaterapi.'
    },
    {
      sku: 'ATS-CGL-050',
      name: 'Minyak Cengkeh Clove Leaf 50ml',
      category: 'Minyak Atsiri',
      category_id: categoryMap['Minyak Atsiri'],
      unit: 'btl',
      price: 135000,
      stock: 12,
      description: 'Ekstrak daun cengkeh eugenol tinggi untuk antiseptik dan industri farmasi.'
    },
    {
      sku: 'FRG-OUB-030',
      name: 'Konsentrat Bibit Parfum Oud Wood 30ml',
      category: 'Wewangian',
      category_id: categoryMap['Wewangian'],
      unit: 'btl',
      price: 490000,
      stock: 18,
      description: 'Bibit parfum woody mewah perpaduan agarwood dan amber oriental.'
    },
    {
      sku: 'FRG-ROS-100',
      name: 'Bibit Parfum Damascus Rose 100ml',
      category: 'Wewangian',
      category_id: categoryMap['Wewangian'],
      unit: 'btl',
      price: 380000,
      stock: 25,
      description: 'Konsentrat aroma mawar damaskus feminin elegan dengan ketahanan tinggi.'
    },
    {
      sku: 'BBK-ETH-1000',
      name: 'Etanol Food Grade 96% 1 Liter',
      category: 'Bahan Baku',
      category_id: categoryMap['Bahan Baku'],
      unit: 'ltr',
      price: 95000,
      stock: 120,
      description: 'Pelarut etanol bebas metanol untuk industri parfum dan sanitasi.'
    },
    {
      sku: 'KMS-AMB-030',
      name: 'Botol Kaca Amber Dropper 30ml',
      category: 'Kemasan & Wadah',
      category_id: categoryMap['Kemasan & Wadah'],
      unit: 'pcs',
      price: 6500,
      stock: 350,
      description: 'Botol kaca cokelat anti radiasi UV dengan pipet karet tahan kimia.'
    },
    {
      sku: 'KMS-ALU-100',
      name: 'Kaleng Botol Aluminium Essential Oil 100ml',
      category: 'Kemasan & Wadah',
      category_id: categoryMap['Kemasan & Wadah'],
      unit: 'pcs',
      price: 14500,
      stock: 8,
      description: 'Wadah aluminium bersegel anti bocor standar ekspor pengiriman cairan.'
    }
  ]

  const seededProductIds: { id: string; sku: string; name: string }[] = []

  for (const prod of initialProducts) {
    const { data: existing } = await supabase.from('products').select('id, stock').eq('sku', prod.sku).maybeSingle()
    if (existing) {
      seededProductIds.push({ id: existing.id, sku: prod.sku, name: prod.name })
      console.log(`  ✓ Produk ada: [${prod.sku}] ${prod.name}`)
    } else {
      const { data: inserted, error } = await supabase.from('products').insert(prod).select('id').single()
      if (inserted && !error) {
        seededProductIds.push({ id: inserted.id, sku: prod.sku, name: prod.name })
        console.log(`  ✓ Produk baru: [${prod.sku}] ${prod.name}`)
      }
    }
  }

  // 4. Seed Multi-Date Stock Movements (Today, Week, Month, Year)
  console.log('\n[4/5] Seeding Multi-Date Stock Movements (Historical Audit Ledger)...')
  const now = Date.now()
  const ONE_HOUR = 3600 * 1000
  const ONE_DAY = 24 * ONE_HOUR

  const movementTemplates = [
    // Today
    { daysAgo: 0, hoursAgo: 2, type: 'IN', qty: 20, note: 'Penerimaan stok harian dari laboratorium produksi' },
    { daysAgo: 0, hoursAgo: 4, type: 'OUT', qty: 5, note: 'Pengiriman pesanan e-commerce ke logistik kilat' },
    // This Week (1-5 days ago)
    { daysAgo: 1, hoursAgo: 6, type: 'IN', qty: 35, note: 'Restock mingguan dari supplier PT Bio Atsiri Nusantara' },
    { daysAgo: 2, hoursAgo: 3, type: 'OUT', qty: 15, note: 'Distribusi pesanan B2B ke cabang distributor Jakarta' },
    { daysAgo: 4, hoursAgo: 5, type: 'IN', qty: 50, note: 'Penerimaan bahan kemasan kontainer batch #K-109' },
    { daysAgo: 5, hoursAgo: 8, type: 'OUT', qty: 25, note: 'Pengeluaran botol untuk pengemasan lini wewangian' },
    // This Month (10-25 days ago)
    { daysAgo: 12, hoursAgo: 4, type: 'IN', qty: 60, note: 'Penerimaan pesanan pembelian PO-2026-081 dari mitra tani' },
    { daysAgo: 18, hoursAgo: 7, type: 'OUT', qty: 30, note: 'Pengiriman pesanan bulk industri kosmetik Surabaya' },
    { daysAgo: 24, hoursAgo: 2, type: 'IN', qty: 40, note: 'Restock bahan baku pelarut etanol batch tengah bulan' },
    // Past Months / Year (45-120 days ago)
    { daysAgo: 45, hoursAgo: 5, type: 'IN', qty: 100, note: 'Penerimaan stok panen raya nilam dan sereh wangi' },
    { daysAgo: 75, hoursAgo: 6, type: 'OUT', qty: 45, note: 'Ekspor kontainer parsial wewangian ke distributor regional' },
    { daysAgo: 110, hoursAgo: 3, type: 'IN', qty: 80, note: 'Penerimaan awal kuartal dari pusat distilasi' }
  ]

  let totalMovementsSeeded = 0

  for (const prod of seededProductIds) {
    // Current stock of product
    const { data: pData } = await supabase.from('products').select('stock').eq('id', prod.id).single()
    const currentRunningStock = pData?.stock || 50

    // Pick 3-5 movements per product
    const count = 3 + Math.floor(Math.random() * 3)
    const selected = movementTemplates.slice(0, count)

    for (const tpl of selected) {
      const timestamp = new Date(now - tpl.daysAgo * ONE_DAY - tpl.hoursAgo * ONE_HOUR).toISOString()
      const isOut = tpl.type === 'OUT'
      const qty = Math.min(tpl.qty, Math.max(1, Math.floor(currentRunningStock / 2)))

      const beforeStock = isOut ? currentRunningStock + qty : Math.max(0, currentRunningStock - qty)
      const afterStock = currentRunningStock

      const { error: movErr } = await supabase.from('stock_movements').insert({
        product_id: prod.id,
        user_id: staffUserId,
        type: isOut ? 'OUT' : 'IN',
        quantity: qty,
        stock_before: beforeStock,
        stock_after: afterStock,
        note: `[${prod.sku}] ${tpl.note}`,
        created_at: timestamp
      })

      if (!movErr) {
        totalMovementsSeeded++
      }
    }
  }

  console.log(`  ✓ Total riwayat mutasi stok audit berhasil dibuat: ${totalMovementsSeeded} baris`)

  // 5. Seed Website Settings
  console.log('\n[5/5] Seeding Website Corporate Settings...')
  const defaultWebsiteSettings = {
    id: '00000000-0000-0000-0000-000000000001',
    site_name: 'Inventra ERP',
    tagline: 'Sistem Manajemen Inventaris & Mutasi Stok Real-Time',
    company_name: 'PT. Syailendra Bumi Investama (DDistillers)',
    description:
      'Aplikasi ERP mini untuk pengelolaan stok barang, katalog produk, dan pelacakan riwayat mutasi stok dengan integritas audit berbasis peran.',
    about:
      'PT. Syailendra Bumi Investama (DDistillers) berfokus pada penyulingan minyak atsiri nusantara, formulasi wewangian premium, dan manajemen pergudangan berstandar internasional.',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    favicon_url: null,
    contact_email: 'logistik@ddistillers.com',
    contact_phone: '+62 21 8792 4500',
    contact_address: 'Kawasan Industri Sentul, Jl. Olympic Raya Kav. 18, Sentul, Bogor, Jawa Barat 16810',
    updated_at: new Date().toISOString()
  }

  const { error: wsError } = await supabase.from('website_settings').upsert(defaultWebsiteSettings, { onConflict: 'id' })

  if (!wsError) {
    console.log('  ✓ Pengaturan profil website berhasil di-seed.')
  } else {
    console.warn('  Gagal seed website_settings:', wsError.message)
  }

  console.log('\n=== COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY ===')
}

main().catch((err) => {
  console.error('Fatal Seeder Error:', err)
  process.exit(1)
})
