'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LineChart,
  Package,
  Settings,
  Shield,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoutButton } from '@/features/auth/logout-button'
import { cn } from '@/lib/utils'

import type { UserProfile } from '@/types/auth'

interface AppSidebarProps {
  locale: string
  profile: UserProfile
  isCollapsed?: boolean
  className?: string
}

export function AppSidebar({ locale, profile, isCollapsed = false, className }: AppSidebarProps) {
  const pathname = usePathname()
  const tSidebar = useTranslations('sidebar')
  const tAuth = useTranslations('auth')

  const isAdmin = profile.role === 'admin_gudang' || profile.role === 'administrator'

  const menuGroups = [
    {
      id: 'main',
      label: tSidebar('groups.main'),
      items: [
        {
          href: `/${locale}/dashboard`,
          label: tSidebar('items.dashboard'),
          icon: LayoutDashboard,
          isActive: pathname === `/${locale}/dashboard` || pathname === '/dashboard'
        }
      ]
    },
    {
      id: 'management',
      label: tSidebar('groups.management'),
      items: [
        {
          href: `/${locale}/inventory`,
          label: tSidebar('items.catalog'),
          icon: Package,
          isActive: pathname.startsWith(`/${locale}/inventory`) || pathname.startsWith('/inventory')
        },
        {
          href: `/${locale}/categories`,
          label: tSidebar('items.categories'),
          icon: FolderTree,
          isActive: pathname.startsWith(`/${locale}/categories`) || pathname.startsWith('/categories')
        },
        {
          href: `/${locale}/transactions`,
          label: tSidebar('items.transactions'),
          icon: ArrowDownUp,
          isActive: pathname.startsWith(`/${locale}/transactions`) || pathname.startsWith('/transactions')
        }
      ]
    },
    {
      id: 'reports',
      label: tSidebar('groups.reports'),
      items: [
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
          icon: LineChart,
          isActive: pathname.includes('/reports/products')
        }
      ]
    },
    {
      id: 'other',
      label: tSidebar('groups.other'),
      items: [
        {
          href: `/${locale}/assistant`,
          label: tSidebar('items.assistant'),
          icon: Sparkles,
          isActive: pathname.startsWith(`/${locale}/assistant`) || pathname.startsWith('/assistant')
        },
        {
          href: `/${locale}/settings`,
          label: tSidebar('items.settings'),
          icon: Settings,
          isActive: pathname.startsWith(`/${locale}/settings`) || pathname.startsWith('/settings')
        }
      ]
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
        <div className="border-border flex h-16 shrink-0 items-center border-b px-4">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-85"
            aria-label="Inventra ERP Dashboard"
          >
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
        </div>

        {/* Role Badge Section */}
        <div className="border-border shrink-0 border-b px-3 py-2.5">
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

        {/* Navigation Menu Links (Bounded vertical scroll) */}
        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 py-3" aria-label={tSidebar('title')}>
          {menuGroups.map((group, groupIdx) => (
            <div key={group.id} className="space-y-1">
              {!isCollapsed ? (
                <p className="text-muted-foreground/80 px-2.5 pb-1 text-[10px] font-bold tracking-wider uppercase">{group.label}</p>
              ) : (
                groupIdx > 0 && <div className="border-border/60 my-2 border-t" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon
                const content = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                      item.isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      isCollapsed && 'mx-auto h-9 w-9 justify-center p-0'
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
            </div>
          ))}
        </nav>

        {/* User Identity & Utility Footer (Pinned without viewport overflow) */}
        <div className="border-border mt-auto shrink-0 space-y-3 border-t p-3">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {profile.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-xs font-semibold">{profile.fullName}</p>
                <p className="text-muted-foreground truncate font-mono text-[10px]">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Controls Bar: Theme, Language, and Logout as Icons Only with Tooltips */}
          <div className={cn('flex items-center gap-1.5', isCollapsed ? 'flex-col justify-center' : 'justify-between')}>
            <div className={cn('flex items-center gap-1', isCollapsed && 'flex-col')}>
              <ThemeToggle />
              <LocaleSwitcher variant="icon" />
            </div>
            <LogoutButton locale={locale} variant="icon" />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
