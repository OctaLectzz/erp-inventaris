import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SettingsView } from '@/features/settings/settings-view'
import { requireAuth } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface SettingsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('settings.title')} | Inventra`,
    description: t('settings.subtitle')
  }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)

  return <SettingsView profile={profile} locale={locale} />
}
