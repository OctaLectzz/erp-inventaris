'use client'

import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Shield,
  Sparkles,
  Tag,
  UserCheck
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoutButton } from '@/features/auth/logout-button'
import { cn } from '@/lib/utils'

import type { UserProfile } from '@/types/auth'

interface AppSidebarProps {
  locale: string
  profile: UserProfile
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function AppSidebar({ locale, profile, isCollapsed = false, onToggleCollapse, className }: AppSidebarProps) {
  const pathname = usePathname()
  const tNav = useTranslations('navigation')
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')

  const isAdmin = profile.role === 'admin_gudang' || profile.role === 'administrator'

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
      href: `/${locale}/categories`,
      label: tNav('links.categories'),
      icon: Tag,
      isActive: pathname.startsWith(`/${locale}/categories`) || pathname.startsWith('/categories')
    },
    {
      href: `/${locale}/transactions`,
      label: tNav('links.transactions'),
      icon: ArrowDownUp,
      isActive: pathname.startsWith(`/${locale}/transactions`) || pathname.startsWith('/transactions')
    },
    {
      href: `/${locale}/movements`,
      label: tNav('links.movements'),
      icon: ArrowLeftRight,
      isActive: pathname.startsWith(`/${locale}/movements`) || pathname.startsWith('/movements')
    },
    {
      href: `/${locale}/reports`,
      label: tNav('links.reports'),
      icon: BarChart3,
      isActive: pathname.startsWith(`/${locale}/reports`) || pathname.startsWith('/reports')
    },
    {
      href: `/${locale}/assistant`,
      label: tNav('links.assistant'),
      icon: Sparkles,
      isActive: pathname.startsWith(`/${locale}/assistant`) || pathname.startsWith('/assistant')
    }
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        data-slot="app-sidebar"
        className={cn(
          'bg-sidebar text-sidebar-foreground border-border flex h-full flex-col border-r transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'w-18' : 'w-64',
          className
        )}
      >
        {/* Brand Header */}
        <div className="border-border flex h-16 shrink-0 items-center justify-between border-b px-4">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-85">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-primary truncate text-base font-bold tracking-tight">Inventra</span>
                <span className="text-muted-foreground block truncate text-[11px] font-medium">ERP Inventory</span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="text-muted-foreground hover:text-foreground hidden h-8 w-8 lg:flex"
              aria-label={isCollapsed ? tSidebar('expand') : tSidebar('collapse')}
              title={isCollapsed ? tSidebar('expand') : tSidebar('collapse')}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Role Badge Section */}
        <div className="border-border border-b px-3 py-2.5">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'mx-auto flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold shadow-2xs',
                    isAdmin ? 'border-accent/40 bg-accent/15 text-accent-foreground dark:text-accent' : 'border-primary/40 bg-secondary text-primary'
                  )}
                >
                  {isAdmin ? <Shield className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold">{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</p>
                <p className="text-muted-foreground text-[10px]">{profile.role}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-2xs',
                isAdmin ? 'border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent' : 'border-primary/30 bg-secondary text-primary'
              )}
            >
              {isAdmin ? (
                <Shield className="text-accent h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <UserCheck className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</p>
                <p className="text-muted-foreground font-mono text-[10px] lowercase">role: {profile.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-4" aria-label={tSidebar('title')}>
          {!isCollapsed && (
            <p className="text-muted-foreground px-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase">{tSidebar('title')}</p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const content = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors',
                  item.isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center px-0'
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right">
                    <span>{item.label}</span>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return content
          })}
        </nav>

        {/* User Identity & Utility Footer */}
        <div className="border-border mt-auto space-y-3 border-t p-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {profile.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-semibold">{profile.fullName}</p>
                <p className="text-muted-foreground truncate font-mono text-[10px]">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Controls Bar (Locale, Theme, Logout) */}
          <div className={cn('flex items-center gap-1.5', isCollapsed ? 'flex-col items-center' : 'justify-between')}>
            <div className="flex items-center gap-1">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            <LogoutButton locale={locale} />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
