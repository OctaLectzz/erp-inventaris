import { ArrowDownUp, ArrowLeftRight, BarChart3, FolderTree, LayoutDashboard, LineChart, Package, Settings, Sparkles } from 'lucide-react'

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
}

export function getSidebarMenuGroups({ locale, pathname, tSidebar }: GetMenuGroupsParams): SidebarGroup[] {
  return [
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
          badge: 'AI',
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
}
