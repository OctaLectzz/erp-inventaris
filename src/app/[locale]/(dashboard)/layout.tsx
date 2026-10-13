import { setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { DashboardShell } from '@/components/shared/dashboard-shell'
import { requireAuth } from '@/services/auth-service'

import type { ReactNode } from 'react'

export const instant = false

interface DashboardLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary authentication and retrieve authoritative profile
  const { profile } = await requireAuth(locale)

  return (
    <DashboardShell locale={locale} profile={profile}>
      {children}
    </DashboardShell>
  )
}
