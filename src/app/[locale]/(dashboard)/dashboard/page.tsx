import { AlertTriangle, Banknote, Boxes, CheckCircle2, Package, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { MovementFlowChart } from '@/components/shared/charts/movement-flow-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodFilter } from '@/features/analytics/period-filter'
import { KpiStatCard } from '@/features/dashboard/kpi-stat-card'
import { LowStockWatchlist } from '@/features/dashboard/low-stock-watchlist'
import { RecentMovementsCard } from '@/features/dashboard/recent-movements-card'
import { formatCurrencyIDR, formatNumber } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/server'
import { getPeriodStockAnalytics } from '@/services/analytics-service'
import { requireAuth } from '@/services/auth-service'
import { getInventoryDashboardData } from '@/services/product-service'
import { getStockMovements } from '@/services/stock-movement-service'

import type { PeriodKey } from '@/lib/date-boundaries'
import type { Metadata } from 'next'

export const instant = false

interface DashboardPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ period?: string; startDate?: string; endDate?: string }>
}

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('title')} | Inventra`,
    description: t('subtitle')
  }
}

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })
  const tAuth = await getTranslations({ locale, namespace: 'auth' })

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawPeriod = resolvedSearchParams.period as PeriodKey | undefined
  const validPeriods: PeriodKey[] = ['today', 'week', 'month', 'year', 'all', 'custom']
  const period: PeriodKey = rawPeriod && validPeriods.includes(rawPeriod) ? rawPeriod : 'month'

  // Query live metrics, recent movements, and period analytics in parallel
  const supabase = await createClient()
  const [{ summary, lowStockProducts }, { movements: recentMovements }, analyticsData] = await Promise.all([
    getInventoryDashboardData(supabase),
    getStockMovements(supabase, { page: 1, pageSize: 5 }),
    getPeriodStockAnalytics(supabase, period, resolvedSearchParams.startDate, resolvedSearchParams.endDate)
  ])

  const isAdministrator = profile.role === 'administrator' || profile.role === 'admin_gudang'
  const isStaff = profile.role === 'staff_gudang'

  const roleTitle = isAdministrator ? tAuth('roles.administrator') : isStaff ? tAuth('roles.staff_gudang') : tAuth('roles.auditor')

  const roleDesc = isAdministrator
    ? tDashboard('adminCapabilitiesDesc')
    : isStaff
      ? tDashboard('staffCapabilitiesDesc')
      : tDashboard('auditorCapabilitiesDesc')

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            {tDashboard('welcome')}, {profile.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{tDashboard('subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground shadow-2xs sm:self-auto dark:text-accent">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{tDashboard('welcomeTag')}</span>
        </div>
      </div>

      {/* Role Authorization Status Banner */}
      <Card
        className={`border shadow-2xs ${
          isAdministrator ? 'border-accent/40 bg-accent/5' : isStaff ? 'border-primary/40 bg-primary/5' : 'border-muted-foreground/30 bg-secondary/50'
        }`}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isAdministrator
                  ? 'bg-accent text-accent-foreground'
                  : isStaff
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isAdministrator || isStaff ? (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-foreground">
                {tDashboard('roleCardTitle')}: <span className="font-semibold text-primary">{roleTitle}</span>
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{roleDesc}</p>
            </div>
          </div>

          <div className="shrink-0 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-mono font-medium text-foreground">
              <span className={`h-2 w-2 rounded-full ${isAdministrator ? 'bg-accent' : isStaff ? 'bg-primary' : 'bg-muted-foreground'}`} />
              Role: {profile.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Period Filter Toolbar */}
      <PeriodFilter currentPeriod={period} startDate={resolvedSearchParams.startDate} endDate={resolvedSearchParams.endDate} />

      {/* KPI Stat Cards Grid with Left Accent Borders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Catalog SKUs */}
        <KpiStatCard
          title={tDashboard('kpi.totalProducts')}
          value={formatNumber(summary.totalSkus, locale)}
          description={tDashboard('kpiDescriptions.skus')}
          icon={Package}
          variant="secondary"
        />

        {/* Total Stock Units */}
        <KpiStatCard
          title={tDashboard('kpi.totalStock')}
          value={formatNumber(summary.totalUnits, locale)}
          description={tDashboard('kpiDescriptions.units')}
          icon={Boxes}
          variant="accent"
        />

        {/* Total Valuation with Compact View & Full Tooltip */}
        <KpiStatCard
          title={tDashboard('valuation')}
          value={formatCurrencyIDR(summary.totalInventoryValue, { locale, compact: true })}
          tooltip={tDashboard('valuationExactTooltip', {
            amount: formatCurrencyIDR(summary.totalInventoryValue, { locale, compact: false })
          })}
          description={tDashboard('kpiDescriptions.valuation')}
          icon={Banknote}
          variant="secondary"
        />

        {/* Low Stock Alerts */}
        <KpiStatCard
          title={tDashboard('kpi.lowStockAlerts')}
          value={formatNumber(summary.lowStockCount, locale)}
          description={tDashboard('kpiDescriptions.lowStock')}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Real-time Movement Flow Chart */}
      <MovementFlowChart
        data={analyticsData.summary.buckets}
        title={tDashboard('analytics.flowTitle')}
        subtitle={tDashboard('analytics.flowSubtitle')}
        inLabel={tDashboard('analytics.inLabel')}
        outLabel={tDashboard('analytics.outLabel')}
        emptyMessage={tDashboard('analytics.emptyMessage')}
      />

      {/* Dual Section: Low Stock Watchlist & Recent Activity */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Low Stock Watchlist */}
        <LowStockWatchlist products={lowStockProducts} locale={locale} isAdmin={isAdministrator} />

        {/* Recent Movements Activity Feed */}
        <RecentMovementsCard movements={recentMovements} locale={locale} />
      </div>

      {/* Security & Verification Status Card */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-primary">{tDashboard('securitySummary.title')}</CardTitle>
          <CardDescription className="text-xs">{tDashboard('securitySummary.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">{tDashboard('securitySummary.stockGuardTitle')}</p>
                <p className="text-[11px] text-muted-foreground">{tDashboard('securitySummary.stockGuardDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">{tDashboard('securitySummary.authoritativeTitle')}</p>
                <p className="text-[11px] text-muted-foreground">{tDashboard('securitySummary.authoritativeDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">{tDashboard('securitySummary.ownerBoundaryTitle')}</p>
                <p className="text-[11px] text-muted-foreground">{tDashboard('securitySummary.ownerBoundaryDesc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
