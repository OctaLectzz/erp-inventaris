import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { setRequestLocale } from 'next-intl/server'

import { requireAuth } from '@/services/auth-service'
import { canUseAiOps, canUseAiQa } from '@/types/auth'

export const instant = false

interface AssistantPageProps {
  params: Promise<{ locale: string }>
}

export default async function AssistantPage({ params }: AssistantPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)

  if (canUseAiOps(profile.role)) {
    redirect(`/${locale}/assistant/draft`)
  }

  if (canUseAiQa(profile.role)) {
    redirect(`/${locale}/assistant/qa`)
  }

  redirect(`/${locale}/dashboard`)
}
