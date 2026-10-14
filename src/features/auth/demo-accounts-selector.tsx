'use client'

import { ArrowRight, Boxes, Check, Loader2, Package, Shield, ShieldCheck, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

import type { UserRole } from '@/types/auth'

interface DemoAccountsSelectorProps {
  onSelectAccount: (role: UserRole) => void
  disabled?: boolean
  isLoading?: boolean
  activeRole?: UserRole | null
}

interface DemoAccountItem {
  role: UserRole
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  titleKey: 'roles.administrator' | 'roles.owner' | 'roles.staff_gudang' | 'roles.auditor' | 'roles.admin_gudang'
  badgeKey: 'login.demoBadgeFull' | 'login.demoBadgeOwner' | 'login.demoBadgeOps' | 'login.demoBadgeAudit' | 'login.demoBadgeAdminGudang'
  descKey: 'roles.adminDesc' | 'roles.ownerDesc' | 'roles.staffDesc' | 'roles.auditorDesc' | 'roles.adminGudangDesc'
  email: string
  color: {
    bg: string
    text: string
  }
}

const DEMO_ITEMS: DemoAccountItem[] = [
  {
    role: 'administrator',
    icon: Shield,
    titleKey: 'roles.administrator',
    badgeKey: 'login.demoBadgeFull',
    descKey: 'roles.adminDesc',
    email: 'admin@inventra.demo',
    color: {
      bg: 'bg-teal-500/15 dark:bg-teal-500/20',
      text: 'text-teal-600 dark:text-teal-400'
    }
  },
  {
    role: 'owner',
    icon: UserCheck,
    titleKey: 'roles.owner',
    badgeKey: 'login.demoBadgeOwner',
    descKey: 'roles.ownerDesc',
    email: 'owner@inventra.demo',
    color: {
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400'
    }
  },
  {
    role: 'staff_gudang',
    icon: Package,
    titleKey: 'roles.staff_gudang',
    badgeKey: 'login.demoBadgeOps',
    descKey: 'roles.staffDesc',
    email: 'staff@inventra.demo',
    color: {
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400'
    }
  },
  {
    role: 'auditor',
    icon: ShieldCheck,
    titleKey: 'roles.auditor',
    badgeKey: 'login.demoBadgeAudit',
    descKey: 'roles.auditorDesc',
    email: 'auditor@inventra.demo',
    color: {
      bg: 'bg-blue-500/15 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400'
    }
  },
  {
    role: 'admin_gudang',
    icon: Boxes,
    titleKey: 'roles.admin_gudang',
    badgeKey: 'login.demoBadgeAdminGudang',
    descKey: 'roles.adminGudangDesc',
    email: 'admingudang@inventra.demo',
    color: {
      bg: 'bg-purple-500/15 dark:bg-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400'
    }
  }
]

export function DemoAccountsSelector({ onSelectAccount, disabled = false, isLoading = false, activeRole = null }: DemoAccountsSelectorProps) {
  const tAuth = useTranslations('auth')

  return (
    <div className="flex flex-col gap-2">
      {DEMO_ITEMS.map((item) => {
        const isCurrentRole = activeRole === item.role

        return (
          <button
            key={item.role}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAccount(item.role)}
            className={cn(
              'group relative flex w-full items-center justify-between gap-2.5 rounded-lg border p-2.5 text-left transition-all sm:rounded-xl',
              'focus:ring-accent focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
              isCurrentRole
                ? 'border-accent bg-accent/10 ring-accent/30 shadow-xs ring-1'
                : 'border-border/80 bg-secondary/30 hover:border-accent/60 hover:bg-secondary/60'
            )}
            aria-label={`${tAuth(item.titleKey)}: ${item.email}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <div
                className={cn(
                  'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 sm:h-9 sm:w-9',
                  item.color.bg,
                  item.color.text
                )}
              >
                <item.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-foreground text-xs font-bold tracking-tight">{tAuth(item.titleKey)}</span>
                  <span className="border-border/60 bg-background/80 text-muted-foreground rounded-full border px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]">
                    {tAuth(item.badgeKey)}
                  </span>
                </div>
                <p className="text-muted-foreground font-mono text-[11px]">{item.email}</p>
                <p className="text-muted-foreground/80 line-clamp-1 text-[10px] leading-snug sm:text-[11px]">{tAuth(item.descKey)}</p>
              </div>
            </div>

            <div className="shrink-0 pl-1">
              {isLoading && isCurrentRole ? (
                <div className="text-accent flex items-center gap-1.5 text-xs font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                </div>
              ) : isCurrentRole ? (
                <span className="text-accent flex items-center gap-1 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{tAuth('login.demoActionActive')}</span>
                </span>
              ) : (
                <span className="text-muted-foreground group-hover:text-accent flex items-center gap-1 text-xs font-medium transition-colors">
                  <span>{tAuth('login.demoActionUse')}</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
