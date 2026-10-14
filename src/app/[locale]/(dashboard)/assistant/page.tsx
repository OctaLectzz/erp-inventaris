import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { getAiConfigStatusAction } from '@/app/actions/ai-actions'
import { AssistantView } from '@/features/assistant/assistant-view'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getCatalogCategories } from '@/services/product-service'
import { canManageCatalog, isAuditorRole } from '@/types/auth'

import type { Metadata } from 'next'

export const instant = false

interface AssistantPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AssistantPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'assistant' })

  return {
    title: `${t('title')} | Inventra`,
    description: t('subtitle')
  }
}

export default async function AssistantPage({ params }: AssistantPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  const supabase = await createClient()

  const [categories, configStatus] = await Promise.all([getCatalogCategories(supabase).catch(() => []), getAiConfigStatusAction()])

  return (
    <AssistantView
      locale={locale}
      canSaveToCatalog={canManageCatalog(profile.role)}
      isAuditor={isAuditorRole(profile.role)}
      categories={categories}
      configStatus={configStatus}
    />
  )
}
