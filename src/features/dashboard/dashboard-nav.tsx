'use client'

import { LayoutDashboard, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardNavProps {
  locale: string
}

export function DashboardNav({ locale }: DashboardNavProps) {
  const pathname = usePathname()
  const tNav = useTranslations('navigation')

  const isDashboardActive = pathname === `/${locale}/dashboard` || pathname === '/dashboard'
  const isCatalogActive = pathname.startsWith(`/${locale}/inventory`) || pathname.startsWith('/inventory')

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Menu navigasi utama">
      <Link
        href={`/${locale}/dashboard`}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          isDashboardActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{tNav('links.dashboard')}</span>
      </Link>

      <Link
        href={`/${locale}/inventory`}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          isCatalogActive ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Package className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{tNav('links.catalog')}</span>
      </Link>
    </nav>
  )
}
