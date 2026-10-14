import { Globe } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import { WebsiteSettingsForm } from '@/features/settings/website-settings-form'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getWebsiteSettings } from '@/services/website-settings-service'
import { canManageWebsiteSettings } from '@/types/auth'

import type { Metadata } from 'next'

export const instant = false

interface WebsiteSettingsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: WebsiteSettingsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.websiteSettings')} | Inventra`,
    description: 'Konfigurasi identitas website, nama sistem, logo, dan kontak perusahaan'
  }
}

export default async function WebsiteSettingsPage({ params }: WebsiteSettingsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)

  if (!canManageWebsiteSettings(profile.role)) {
    redirect(`/${locale}/dashboard`)
  }

  const supabase = await createClient()
  const settings = await getWebsiteSettings(supabase)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <Globe className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">Pengaturan Website</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Kelola nama sistem, profil entitas bisnis, logo brand, dan informasi kontak operasional.
            </p>
          </div>
        </div>
      </div>

      <WebsiteSettingsForm initialSettings={settings} locale={locale} />
    </div>
  )
}
