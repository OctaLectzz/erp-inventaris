import { ArrowDownRight, ArrowLeftRight, ArrowRight, ArrowUpRight, BarChart3, LineChart, Package, RefreshCw } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { connection } from 'next/server'

import { MovementFlowChart } from '@/components/shared/charts/movement-flow-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodFilter } from '@/features/analytics/period-filter'
import { KpiStatCard } from '@/features/dashboard/kpi-stat-card'
import { formatNumber } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/server'
import { getPeriodStockAnalytics } from '@/services/analytics-service'
import { requireAuth } from '@/services/auth-service'

import type { PeriodKey } from '@/lib/date-boundaries'
import type { Metadata } from 'next'

export const instant = false

interface ReportsPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ period?: string; startDate?: string; endDate?: string }>
}

export async function generateMetadata({ params }: ReportsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('reports.title')} | Inventra`,
    description: t('reports.subtitle')
  }
}

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  await requireAuth(locale)
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawPeriod = resolvedSearchParams.period as PeriodKey | undefined
  const validPeriods: PeriodKey[] = ['today', 'week', 'month', 'year', 'all', 'custom']
  const period: PeriodKey = rawPeriod && validPeriods.includes(rawPeriod) ? rawPeriod : 'month'

  const supabase = await createClient()
  const analyticsData = await getPeriodStockAnalytics(supabase, period, resolvedSearchParams.startDate, resolvedSearchParams.endDate)

  const { summary } = analyticsData

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tDashboard('reports.title')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{tDashboard('reports.subtitle')}</p>
          </div>
        </div>

        <div className="border-accent/40 bg-accent/10 text-accent-foreground dark:text-accent inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs sm:self-auto">
          <BarChart3 className="text-accent h-3.5 w-3.5" aria-hidden="true" />
          <span>Analisis Terpadu</span>
        </div>
      </div>

      {/* Period Filter Toolbar */}
      <PeriodFilter currentPeriod={period} startDate={resolvedSearchParams.startDate} endDate={resolvedSearchParams.endDate} />

      {/* Period Stock Flow Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total IN in Period */}
        <KpiStatCard
          title={tDashboard('reports.periodIn')}
          value={`+${formatNumber(summary.totalInUnits, locale)}`}
          description={tDashboard('analytics.inUnits', { count: formatNumber(summary.totalInUnits, locale) })}
          icon={ArrowUpRight}
          variant="accent"
        />

        {/* Total OUT in Period */}
        <KpiStatCard
          title={tDashboard('reports.periodOut')}
          value={`-${formatNumber(summary.totalOutUnits, locale)}`}
          description={tDashboard('analytics.outUnits', { count: formatNumber(summary.totalOutUnits, locale) })}
          icon={ArrowDownRight}
          variant="destructive"
        />

        {/* Net Flow in Period */}
        <KpiStatCard
          title={tDashboard('reports.periodNet')}
          value={summary.netFlow > 0 ? `+${formatNumber(summary.netFlow, locale)}` : formatNumber(summary.netFlow, locale)}
          description={tDashboard('analytics.netFlow')}
          icon={RefreshCw}
          variant="secondary"
        />

        {/* Transactions in Period */}
        <KpiStatCard
          title={tDashboard('analytics.periodSummary')}
          value={formatNumber(summary.totalTransactions, locale)}
          description={tDashboard('analytics.transactions', { count: formatNumber(summary.totalTransactions, locale) })}
          icon={ArrowLeftRight}
          variant="default"
        />
      </div>

      {/* Movement Flow Chart */}
      <MovementFlowChart
        data={summary.buckets}
        title={tDashboard('analytics.flowTitle')}
        subtitle={tDashboard('analytics.flowSubtitle')}
        inLabel={tDashboard('analytics.inLabel')}
        outLabel={tDashboard('analytics.outLabel')}
        emptyMessage={tDashboard('analytics.emptyMessage')}
      />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border hover:border-accent/40 shadow-xs transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <LineChart className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">{tDashboard('reports.productsTitle')}</CardTitle>
            </div>
            <CardDescription className="pt-1 text-xs">{tDashboard('reports.productsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/reports/products`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Buka Direktori Produk</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-primary/40 shadow-xs transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-bold">Buku Besar Riwayat Lengkap</CardTitle>
            </div>
            <CardDescription className="pt-1 text-xs">
              Lihat seluruh catatan mutasi stok individual dengan filter pencarian dan pengguna
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/movements`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Lihat Riwayat Mutasi</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
