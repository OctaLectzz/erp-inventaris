import { toWebsiteSettings } from '@/types/settings'

import type { Database } from '@/types/database'
import type { WebsiteSettings, WebsiteSettingsRow } from '@/types/settings'
import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_SETTINGS: WebsiteSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  siteName: 'Inventra',
  tagline: 'Sistem Manajemen Inventaris & Mutasi Stok Real-Time',
  companyName: 'PT. Syailendra Bumi Investama (DDistillers)',
  description: 'Aplikasi ERP mini untuk pengelolaan stok barang, katalog produk, dan pelacakan riwayat mutasi stok.',
  about: 'Inventra dikembangkan untuk memenuhi kebutuhan pemantauan logistik dan pergudangan dengan akurasi tinggi dan integritas audit.',
  logoUrl: '',
  faviconUrl: null,
  contactEmail: 'admin@ddistillers.com',
  contactPhone: '+62 812-3456-7890',
  contactAddress: 'Kawasan Industri Sentul, Bogor, Jawa Barat, Indonesia',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

/**
 * Fetch singleton website settings. Returns default fallback if empty.
 */
export async function getWebsiteSettings(supabase: SupabaseClient<Database>): Promise<WebsiteSettings> {
  const { data, error } = await supabase.from('website_settings').select('*').limit(1).maybeSingle()

  if (error || !data) {
    return DEFAULT_SETTINGS
  }

  return toWebsiteSettings(data as unknown as WebsiteSettingsRow)
}
