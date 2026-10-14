'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { websiteSettingsSchema } from '@/schemas/website-settings-schema'
import { requireAuth } from '@/services/auth-service'
import { canManageWebsiteSettings } from '@/types/auth'
import { toWebsiteSettings } from '@/types/settings'

import type { WebsiteSettingsInput } from '@/schemas/website-settings-schema'
import type { WebsiteSettings, WebsiteSettingsRow } from '@/types/settings'

export type SettingsActionResult<T = WebsiteSettings> =
  { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

export async function updateWebsiteSettingsAction(input: WebsiteSettingsInput, locale = 'id'): Promise<SettingsActionResult> {
  let profile
  try {
    const authContext = await requireAuth(locale)
    profile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!canManageWebsiteSettings(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya Administrator atau Pemilik Usaha yang memiliki izin untuk mengubah pengaturan website.'
    }
  }

  const parsed = websiteSettingsSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') fieldErrors[field] = issue.message
    }
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Data pengaturan website tidak valid. Silakan periksa kembali formulir.',
      fieldErrors
    }
  }

  const data = parsed.data

  try {
    const supabase = await createClient()

    // Find the singleton id
    const { data: existing } = await supabase.from('website_settings').select('id').limit(1).maybeSingle()

    const payload = {
      site_name: data.siteName,
      tagline: data.tagline,
      company_name: data.companyName,
      description: data.description || null,
      about: data.about || null,
      logo_url: data.logoUrl || null,
      favicon_url: data.faviconUrl || null,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      contact_address: data.contactAddress,
      updated_at: new Date().toISOString()
    }

    let updatedRow
    if (existing?.id) {
      const { data: res, error } = await supabase.from('website_settings').update(payload).eq('id', existing.id).select().single()

      if (error) throw error
      updatedRow = res
    } else {
      const { data: res, error } = await supabase
        .from('website_settings')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          ...payload
        })
        .select()
        .single()

      if (error) throw error
      updatedRow = res
    }

    revalidatePath(`/${locale}/settings/website`, 'page')
    return { success: true, data: toWebsiteSettings(updatedRow as unknown as WebsiteSettingsRow) }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi gangguan saat menyimpan pengaturan website.'
    return { success: false, error: 'DB_ERROR', message }
  }
}
