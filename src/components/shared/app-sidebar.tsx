'use client'

import { Boxes, Shield, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { getSidebarMenuGroups } from '@/components/shared/sidebar-nav-items'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
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

  const isAdministrator = profile.role === 'administrator' || profile.role === 'admin_gudang'
  const isStaff = profile.role === 'staff_gudang'

  const roleTitle = isAdministrator ? tAuth('roles.administrator') : isStaff ? tAuth('roles.staff_gudang') : tAuth('roles.auditor')

  const menuGroups = getSidebarMenuGroups({ locale, pathname, tSidebar })

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        data-slot="app-sidebar"
        className={cn(
          'bg-sidebar text-sidebar-foreground flex h-full flex-col border-r border-border transition-[width] duration-300 ease-in-out',
          isCollapsed ? 'w-18' : 'w-64',
          className
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 overflow-hidden transition-opacity hover:opacity-85"
            aria-label="Inventra ERP Dashboard"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-primary uppercase">Inventra</span>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">ERP Gudang</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-6">
            {menuGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                {!isCollapsed && <h3 className="px-3 text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">{group.label}</h3>}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const navLink = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                          item.isActive
                            ? 'bg-accent/15 font-semibold text-accent-foreground shadow-2xs'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          isCollapsed && 'justify-center px-0'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!isCollapsed && item.badge && (
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs font-medium">
                            <p>{item.label}</p>
                            {item.notice && <p className="text-[10px] text-muted-foreground">{item.notice}</p>}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    if (item.notice) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.notice}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return navLink
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile & Role Info */}
        <div className="bg-sidebar/50 border-t border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{profile.fullName}</p>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate text-[10px] font-medium text-muted-foreground">{roleTitle}</span>
                  </div>
                </div>
              )}
            </div>
            <LogoutButton locale={locale} variant={isCollapsed ? 'icon' : 'default'} />
          </div>

          {/* Theme & Language Controls */}
          {!isCollapsed && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
