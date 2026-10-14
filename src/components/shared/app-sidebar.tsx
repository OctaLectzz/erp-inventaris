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

  const isOwner = profile.role === 'owner'
  const isAdministrator = profile.role === 'administrator' || profile.role === 'admin_gudang'
  const isStaff = profile.role === 'staff_gudang'

  const roleTitle = isAdministrator
    ? tAuth('roles.administrator')
    : isStaff
      ? tAuth('roles.staff_gudang')
      : isOwner
        ? tAuth('roles.owner')
        : tAuth('roles.auditor')

  const menuGroups = getSidebarMenuGroups({ locale, pathname, tSidebar, role: profile.role })

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
            <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-primary text-sm font-black tracking-tight uppercase">Inventra</span>
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">ERP Gudang</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-6">
            {menuGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                {!isCollapsed && <h3 className="text-muted-foreground/80 px-3 text-[11px] font-bold tracking-wider uppercase">{group.label}</h3>}
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
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          isCollapsed && 'justify-center px-0'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!isCollapsed && item.badge && (
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-bold', item.isActive ? 'bg-primary-foreground text-primary border-transparent' : '')}
                          >
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
                            {item.notice && <p className="text-muted-foreground text-[10px]">{item.notice}</p>}
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
        <div className="bg-sidebar/50 border-border border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-semibold">{profile.fullName}</p>
                  <div className="flex items-center gap-1">
                    <Shield className="text-muted-foreground h-3 w-3" aria-hidden="true" />
                    <span className="text-muted-foreground truncate text-[10px] font-medium">{roleTitle}</span>
                  </div>
                </div>
              )}
            </div>
            <LogoutButton locale={locale} variant={isCollapsed ? 'icon' : 'default'} />
          </div>

          {/* Theme & Language Controls */}
          {!isCollapsed && (
            <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
