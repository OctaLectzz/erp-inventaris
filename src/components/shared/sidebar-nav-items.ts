import {
  ArrowDownUp,
  ArrowLeftRight,
  BarChart3,
  Bot,
  FileEdit,
  FolderTree,
  Globe,
  LayoutDashboard,
  LineChart,
  Package,
  Settings,
  Users,
  Wand2
} from 'lucide-react'

import { canManageUsers, canManageWebsiteSettings, canMutateStock, canUseAiOps, canUseAiQa, canViewReports } from '@/types/auth'

export interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  badge?: string
  notice?: string
  isActive: boolean
}

export interface SidebarGroup {
  id: string
  label: string
  items: SidebarItem[]
}

interface GetMenuGroupsParams {
  locale: string
  pathname: string
  tSidebar: (key: string) => string
  role?: string | null
}

export function getSidebarMenuGroups({ locale, pathname, tSidebar, role }: GetMenuGroupsParams): SidebarGroup[] {
  const groups: SidebarGroup[] = []

  // 1. MAIN GROUP
  const mainItems: SidebarItem[] = [
    {
      href: `/${locale}/dashboard`,
      label: tSidebar('items.dashboard'),
      icon: LayoutDashboard,
      isActive: pathname === `/${locale}/dashboard` || pathname === '/dashboard'
    }
  ]

  if (canManageUsers(role)) {
    mainItems.push({
      href: `/${locale}/users`,
      label: tSidebar('items.users'),
      icon: Users,
      isActive: pathname.startsWith(`/${locale}/users`) || pathname.startsWith('/users')
    })
  }

  groups.push({
    id: 'main',
    label: tSidebar('groups.main'),
    items: mainItems
  })

  // 2. MANAGEMENT GROUP
  const managementItems: SidebarItem[] = [
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
    }
  ]

  if (canMutateStock(role)) {
    managementItems.push({
      href: `/${locale}/transactions`,
      label: tSidebar('items.transactions'),
      icon: ArrowDownUp,
      isActive: pathname.startsWith(`/${locale}/transactions`) || pathname.startsWith('/transactions')
    })
  }

  managementItems.push({
    href: `/${locale}/movements`,
    label: tSidebar('items.history'),
    icon: ArrowLeftRight,
    isActive: pathname.startsWith(`/${locale}/movements`) || pathname.startsWith('/movements')
  })

  groups.push({
    id: 'management',
    label: tSidebar('groups.management'),
    items: managementItems
  })

  // 3. REPORTS GROUP (Strictly hidden for warehouse staff / admin_gudang)
  if (canViewReports(role)) {
    const reportItems: SidebarItem[] = [
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

    groups.push({
      id: 'reports',
      label: tSidebar('groups.reports'),
      items: reportItems
    })
  }

  // 4. AI COPILOT GROUP
  const aiItems: SidebarItem[] = []

  if (canUseAiOps(role)) {
    aiItems.push(
      {
        href: `/${locale}/assistant/draft`,
        label: tSidebar('items.aiDraft'),
        icon: Wand2,
        isActive: pathname.includes('/assistant/draft')
      },
      {
        href: `/${locale}/assistant/refine`,
        label: tSidebar('items.aiRefine'),
        icon: FileEdit,
        isActive: pathname.includes('/assistant/refine')
      }
    )
  }

  if (canUseAiQa(role)) {
    aiItems.push({
      href: `/${locale}/assistant/qa`,
      label: tSidebar('items.aiQa'),
      icon: Bot,
      badge: 'Live',
      isActive: pathname.includes('/assistant/qa') || pathname === `/${locale}/assistant`
    })
  }

  if (aiItems.length > 0) {
    groups.push({
      id: 'ai',
      label: tSidebar('groups.ai'),
      items: aiItems
    })
  }

  // 5. SETTINGS GROUP
  const settingItems: SidebarItem[] = [
    {
      href: `/${locale}/settings`,
      label: tSidebar('items.settings'),
      icon: Settings,
      isActive: (pathname.startsWith(`/${locale}/settings`) || pathname.startsWith('/settings')) && !pathname.includes('/settings/website')
    }
  ]

  if (canManageWebsiteSettings(role)) {
    settingItems.push({
      href: `/${locale}/settings/website`,
      label: tSidebar('items.websiteSettings'),
      icon: Globe,
      isActive: pathname.includes('/settings/website')
    })
  }

  groups.push({
    id: 'settings',
    label: tSidebar('groups.settings'),
    items: settingItems
  })

  return groups
}
