'use client'

import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Package,
  Shield,
  Sparkles,
  Tag,
  UserCheck
} from 'lucide-react'
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
  isCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function AppHeader({ locale, profile, isCollapsed = false, onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const tNav = useTranslations('navigation')
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')

  const isAdministrator = profile.role === 'administrator' || profile.role === 'admin_gudang'
  const isStaff = profile.role === 'staff_gudang'

  const roleTitle = isAdministrator ? tAuth('roles.administrator') : isStaff ? tAuth('roles.staff_gudang') : tAuth('roles.auditor')

  const roleDesc = isAdministrator ? tAuth('roles.adminDesc') : isStaff ? tAuth('roles.staffDesc') : tAuth('roles.auditorDesc')

  // Determine current active section for dynamic breadcrumb
  let currentSection = tNav('links.dashboard')
  if (pathname.includes('/inventory')) {
    currentSection = tNav('links.catalog')
  } else if (pathname.includes('/categories')) {
    currentSection = tNav('links.categories')
  } else if (pathname.includes('/transactions')) {
    currentSection = tNav('links.transactions')
  } else if (pathname.includes('/movements')) {
    currentSection = tNav('links.movements')
  } else if (pathname.includes('/reports/products')) {
    currentSection = tNav('links.productAnalysis')
  } else if (pathname.includes('/reports')) {
    currentSection = tNav('links.reports')
  } else if (pathname.includes('/assistant')) {
    currentSection = tNav('links.assistant')
  } else if (pathname.includes('/settings')) {
    currentSection = tNav('links.settings')
  }

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: tSidebar('items.dashboard'),
      icon: LayoutDashboard,
      isActive: pathname === `/${locale}/dashboard` || pathname === '/dashboard'
    },
    {
      href: `/${locale}/inventory`,
      label: tSidebar('items.catalog'),
      icon: Package,
      isActive: pathname.startsWith(`/${locale}/inventory`) || pathname.startsWith('/inventory')
    },
    {
      href: `/${locale}/categories`,
      label: tSidebar('items.categories'),
      icon: Tag,
      isActive: pathname.startsWith(`/${locale}/categories`) || pathname.startsWith('/categories')
    },
    {
      href: `/${locale}/transactions`,
      label: tSidebar('items.transactions'),
      icon: ArrowDownUp,
      isActive: pathname.startsWith(`/${locale}/transactions`) || pathname.startsWith('/transactions')
    },
    {
      href: `/${locale}/movements`,
      label: tSidebar('items.history'),
      icon: ArrowLeftRight,
      isActive: pathname.startsWith(`/${locale}/movements`) || pathname.startsWith('/movements')
    },
    {
      href: `/${locale}/reports`,
      label: tSidebar('items.reports'),
      icon: BarChart3,
      isActive: (pathname.startsWith(`/${locale}/reports`) || pathname.startsWith('/reports')) && !pathname.includes('/reports/products')
    },
    {
      href: `/${locale}/reports/products`,
      label: tSidebar('items.productAnalysis'),
      icon: BarChart3,
      isActive: pathname.includes('/reports/products')
    },
    {
      href: `/${locale}/assistant`,
      label: tSidebar('items.assistant'),
      icon: Sparkles,
      isActive: pathname.startsWith(`/${locale}/assistant`) || pathname.startsWith('/assistant')
    },
    {
      href: `/${locale}/settings`,
      label: tSidebar('items.settings'),
      icon: Tag,
      isActive: pathname.startsWith(`/${locale}/settings`) || pathname.startsWith('/settings')
    }
  ]

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      {/* Left Area: Desktop Toggle, Mobile Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Desktop Hamburger Toggle (Three horizontal lines) */}
        {onToggleSidebar && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="border-border bg-background/80 hover:bg-secondary/60 hidden h-9 w-9 shadow-2xs lg:flex"
            aria-label={isCollapsed ? tSidebar('expand') : tSidebar('collapse')}
            title={isCollapsed ? tSidebar('expand') : tSidebar('collapse')}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile Drawer Sheet Trigger (Three horizontal lines) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-background/80 hover:bg-secondary/60 flex h-9 w-9 shadow-2xs lg:hidden"
              aria-label={tSidebar('openMenu')}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <SheetHeader className="border-border border-b p-4">
              <SheetTitle className="flex items-center gap-2.5 text-left text-base font-bold">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                  <Boxes className="h-4 w-4" />
                </div>
                <span>Inventra ERP</span>
              </SheetTitle>
            </SheetHeader>

            {/* Role Chip */}
            <div className="border-border border-b px-4 py-3">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold',
                  isAdministrator
                    ? 'border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent'
                    : isStaff
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-primary/30 bg-secondary text-primary'
                )}
              >
                {isAdministrator ? (
                  <Shield className="text-accent h-4 w-4 shrink-0" />
                ) : isStaff ? (
                  <Package className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <UserCheck className="text-primary h-4 w-4 shrink-0" />
                )}
                <span>{roleTitle}</span>
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
            <div className="border-border mt-auto space-y-3 border-t p-4">
              <div className="flex flex-col">
                <span className="text-foreground text-xs font-bold">{profile.fullName}</span>
                <span className="text-muted-foreground font-mono text-[11px]">{profile.email}</span>
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
          <Link href={`/${locale}/dashboard`} className="text-muted-foreground hover:text-foreground font-medium transition-colors">
            Inventra
          </Link>
          <ChevronRight className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-foreground font-bold tracking-tight">{currentSection}</span>
        </nav>
      </div>

      {/* Right Area: Identity Badge & Clean User Profile (No duplicate theme/locale/logout controls) */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="flex items-center">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-2xs',
              isAdministrator
                ? 'border-accent/30 bg-accent/15 text-accent-foreground dark:text-accent border'
                : isStaff
                  ? 'border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  : 'border-primary/30 bg-secondary text-primary border'
            )}
            title={roleDesc}
          >
            {isAdministrator ? (
              <Shield className="text-accent h-3.5 w-3.5" aria-hidden="true" />
            ) : isStaff ? (
              <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : (
              <UserCheck className="text-primary h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{roleTitle}</span>
          </span>
        </div>

        {/* User Identity Details (Compact, prevents stacking on tablet viewports) */}
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {profile.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden flex-col items-start md:flex">
            <span className="text-foreground max-w-32 truncate text-xs font-semibold">{profile.fullName}</span>
            <span className="text-muted-foreground max-w-32 truncate font-mono text-[10px]">{profile.email}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
