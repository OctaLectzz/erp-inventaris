import { AlertTriangle, Banknote, Boxes, CheckCircle2, Package, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiStatCard } from '@/features/dashboard/kpi-stat-card'
import { LowStockWatchlist } from '@/features/dashboard/low-stock-watchlist'
import { RecentMovementsCard } from '@/features/dashboard/recent-movements-card'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getInventoryDashboardData } from '@/services/product-service'
import { getStockMovements } from '@/services/stock-movement-service'

import type { Metadata } from 'next'

export const instant = false

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('title')} | Inventra`,
    description: t('subtitle')
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })
  const tAuth = await getTranslations({ locale, namespace: 'auth' })

  // Query live metrics and recent movements in parallel
  const supabase = await createClient()
  const [{ summary, lowStockProducts }, { movements: recentMovements }] = await Promise.all([
    getInventoryDashboardData(supabase),
    getStockMovements(supabase, { page: 1, pageSize: 5 })
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US').format(num)
  }

  const isAdmin = profile.role === 'admin_gudang' || profile.role === 'administrator'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">
            {tDashboard('welcome')}, {profile.fullName}
          </h1>
          <p className="text-muted-foreground text-sm">{tDashboard('subtitle')}</p>
        </div>

        <div className="border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs sm:self-auto">
          <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
          <span>{tDashboard('welcomeTag')}</span>
        </div>
      </div>

      {/* Role Authorization Status Banner */}
      <Card className={`border shadow-2xs ${isAdmin ? 'border-accent/40 bg-accent/5' : 'border-primary/30 bg-secondary/50'}`}>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isAdmin ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
              }`}
            >
              {isAdmin ? <ShieldCheck className="h-5 w-5" aria-hidden="true" /> : <ShieldAlert className="h-5 w-5" aria-hidden="true" />}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-foreground text-sm font-bold">
                {tDashboard('roleCardTitle')}:{' '}
                <span className="text-primary font-semibold">{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
              </h2>
              <p className="text-muted-foreground text-xs">{isAdmin ? tDashboard('adminCapabilitiesDesc') : tDashboard('ownerCapabilitiesDesc')}</p>
            </div>
          </div>

          <div className="shrink-0 text-xs">
            <span className="border-border bg-card text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono font-medium">
              <span className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-accent' : 'bg-primary'}`} />
              Role: {profile.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Catalog SKUs */}
        <KpiStatCard
          title={tDashboard('kpi.totalProducts')}
          value={formatNumber(summary.totalSkus)}
          description={tDashboard('kpiDescriptions.skus')}
          icon={Package}
          variant="secondary"
        />

        {/* Total Stock Units */}
        <KpiStatCard
          title={tDashboard('kpi.totalStock')}
          value={formatNumber(summary.totalUnits)}
          description={tDashboard('kpiDescriptions.units')}
          icon={Boxes}
          variant="accent"
        />

        {/* Total Valuation */}
        <KpiStatCard
          title={tDashboard('valuation')}
          value={formatCurrency(summary.totalInventoryValue)}
          description={tDashboard('kpiDescriptions.valuation')}
          icon={Banknote}
          variant="secondary"
        />

        {/* Low Stock Alerts */}
        <KpiStatCard
          title={tDashboard('kpi.lowStockAlerts')}
          value={formatNumber(summary.lowStockCount)}
          description={tDashboard('kpiDescriptions.lowStock')}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Dual Section: Low Stock Watchlist & Recent Activity */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Low Stock Watchlist */}
        <LowStockWatchlist products={lowStockProducts} locale={locale} isAdmin={isAdmin} />

        {/* Recent Movements Activity Feed */}
        <RecentMovementsCard movements={recentMovements} locale={locale} />
      </div>

      {/* Security & Verification Status Card */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-primary text-sm font-bold">{tDashboard('securitySummary.title')}</CardTitle>
          <CardDescription className="text-xs">{tDashboard('securitySummary.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">{tDashboard('securitySummary.stockGuardTitle')}</p>
                <p className="text-muted-foreground text-[11px]">{tDashboard('securitySummary.stockGuardDesc')}</p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">{tDashboard('securitySummary.authoritativeTitle')}</p>
                <p className="text-muted-foreground text-[11px]">{tDashboard('securitySummary.authoritativeDesc')}</p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">{tDashboard('securitySummary.ownerBoundaryTitle')}</p>
                <p className="text-muted-foreground text-[11px]">{tDashboard('securitySummary.ownerBoundaryDesc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
