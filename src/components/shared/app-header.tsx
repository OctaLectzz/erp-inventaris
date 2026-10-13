'use client'

import { ArrowLeftRight, Boxes, ChevronRight, LayoutDashboard, Menu, Package, Shield, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LogoutButton } from '@/features/auth/logout-button'
import { cn } from '@/lib/utils'

import type { UserProfile } from '@/types/auth'

interface AppHeaderProps {
  locale: string
  profile: UserProfile
}

export function AppHeader({ locale, profile }: AppHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const tNav = useTranslations('navigation')
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')

  const isAdmin = profile.role === 'admin_gudang'

  // Determine current active section for breadcrumb
  let currentSection = tNav('links.dashboard')
  if (pathname.includes('/inventory')) {
    currentSection = tNav('links.catalog')
  } else if (pathname.includes('/movements')) {
    currentSection = tNav('links.movements')
  }

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: tNav('links.dashboard'),
      icon: LayoutDashboard,
      isActive: pathname === `/${locale}/dashboard` || pathname === '/dashboard'
    },
    {
      href: `/${locale}/inventory`,
      label: tNav('links.catalog'),
      icon: Package,
      isActive: pathname.startsWith(`/${locale}/inventory`) || pathname.startsWith('/inventory')
    },
    {
      href: `/${locale}/movements`,
      label: tNav('links.movements'),
      icon: ArrowLeftRight,
      isActive: pathname.startsWith(`/${locale}/movements`) || pathname.startsWith('/movements')
    }
  ]

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      {/* Left Area: Mobile Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile Drawer Sheet Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" aria-label={tSidebar('openMenu')}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2.5 text-left text-base font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Boxes className="h-4 w-4" />
                </div>
                <span>Inventra ERP</span>
              </SheetTitle>
            </SheetHeader>

            {/* Role Chip */}
            <div className="border-b border-border px-4 py-3">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold',
                  isAdmin ? 'border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent' : 'border-primary/30 bg-secondary text-primary'
                )}
              >
                {isAdmin ? <Shield className="h-4 w-4 shrink-0 text-accent" /> : <UserCheck className="h-4 w-4 shrink-0 text-primary" />}
                <span>{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu navigasi mobile">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors',
                      item.isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="mt-auto space-y-3 border-t border-border p-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">{profile.fullName}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
                <LogoutButton locale={locale} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <Link href={`/${locale}/dashboard`} className="font-medium text-muted-foreground transition-colors hover:text-foreground">
            Inventra
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-bold tracking-tight text-foreground">{currentSection}</span>
        </nav>
      </div>

      {/* Right Area: Identity Badge & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Role Badge (Desktop) */}
        <div className="hidden items-center sm:flex">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs',
              isAdmin
                ? 'border border-accent/30 bg-accent/15 text-accent-foreground dark:text-accent'
                : 'border border-primary/30 bg-secondary text-primary'
            )}
            title={isAdmin ? tAuth('roles.adminDesc') : tAuth('roles.ownerDesc')}
          >
            {isAdmin ? (
              <Shield className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            ) : (
              <UserCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            )}
            <span>{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
          </span>
        </div>

        {/* Identity details (hidden on very small screens) */}
        <div className="hidden flex-col items-end text-right md:flex">
          <span className="text-xs font-semibold text-foreground">{profile.fullName}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{profile.email}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeToggle />
          <div className="hidden sm:block">
            <LogoutButton locale={locale} />
          </div>
        </div>
      </div>
    </header>
  )
}
