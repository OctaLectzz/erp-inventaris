import { Bot } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import { getAiConfigStatusAction } from '@/app/actions/ai-actions'
import { AssistantStatusBanner } from '@/features/assistant/assistant-status-banner'
import { InventoryQaTab } from '@/features/assistant/inventory-qa-tab'
import { requireAuth } from '@/services/auth-service'
import { canUseAiQa } from '@/types/auth'

import type { Metadata } from 'next'

export const instant = false

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.aiQa')} | Inventra`,
    description: 'Factual inventory analytics, stock status, and warehouse inquiries powered by AI'
  }
}

export default async function AiQaPage({ params }: PageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)

  if (!canUseAiQa(profile.role)) {
    redirect(`/${locale}/dashboard`)
  }

  const tSidebar = await getTranslations({ locale, namespace: 'sidebar' })
  const tAssistant = await getTranslations({ locale, namespace: 'assistant' })
  const configStatus = await getAiConfigStatusAction()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tSidebar('items.aiQa')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{tAssistant('qaTab.subtitle')}</p>
          </div>
        </div>
      </div>

      <AssistantStatusBanner status={configStatus} />

      <InventoryQaTab locale={locale} />
    </div>
  )
}
