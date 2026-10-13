import Link from 'next/link'
import { Boxes, Shield, UserCheck } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LogoutButton } from '@/features/auth/logout-button'
import { DashboardNav } from '@/features/dashboard/dashboard-nav'
import { requireAuth } from '@/services/auth-service'

import type { ReactNode } from 'react'

export const instant = false

interface DashboardLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary authentication and retrieve authoritative profile
  const { profile } = await requireAuth(locale)

  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tAuth = await getTranslations({ locale, namespace: 'auth' })

  const isAdmin = profile.role === 'admin_gudang'

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Dashboard Top Navigation */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Active Area */}
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 transition-opacity hover:opacity-85">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg shadow-xs">
                <Boxes className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-primary text-lg font-bold tracking-tight">{tCommon('brand.name')}</span>
                <span className="text-muted-foreground hidden text-xs sm:ml-2 sm:inline-block">• {tCommon('brand.subtitle')}</span>
              </div>
            </Link>

            {/* Authoritative Role Badge */}
            <div className="hidden items-center sm:flex">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs ${
                  isAdmin
                    ? 'border-accent/30 bg-accent/15 text-accent-foreground dark:text-accent border'
                    : 'border-primary/30 bg-secondary text-primary border'
                }`}
                title={isAdmin ? tAuth('roles.adminDesc') : tAuth('roles.ownerDesc')}
              >
                {isAdmin ? (
                  <Shield className="text-accent h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UserCheck className="text-primary h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
              </span>
            </div>
            {/* Navigation Tabs */}
            <div className="hidden md:flex md:items-center">
              <DashboardNav locale={locale} />
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Identity details (hidden on small screens) */}
            <div className="hidden flex-col items-end text-right md:flex">
              <span className="text-foreground text-xs font-semibold">{profile.fullName}</span>
              <span className="text-muted-foreground font-mono text-[11px]">{profile.email}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <LocaleSwitcher />
              <ThemeToggle />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="border-border bg-background/90 border-b px-4 py-2 md:hidden">
        <DashboardNav locale={locale} />
      </div>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-border text-muted-foreground border-t py-4 text-center text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span>Inventra &copy; 2026 PT. Syailendra Bumi Investama</span>
          <span className="font-mono text-[11px]">
            Role: <strong className="text-primary font-semibold">{profile.role}</strong>
          </span>
        </div>
      </footer>
    </div>
  )
}
