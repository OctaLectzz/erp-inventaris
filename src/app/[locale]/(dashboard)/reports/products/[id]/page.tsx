import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowDownRight, ArrowUpRight, Boxes, RefreshCw } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MovementFlowChart } from '@/components/shared/charts/movement-flow-chart'
import { PeriodFilter } from '@/features/analytics/period-filter'
import { KpiStatCard } from '@/features/dashboard/kpi-stat-card'
import { ProductDetailHeader } from '@/features/reports/product-detail-header'
import { ProductDetailLedger } from '@/features/reports/product-detail-ledger'
import { formatNumber } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/server'
import { getProductMovementAnalytics } from '@/services/analytics-service'
import { requireAuth } from '@/services/auth-service'
import { canViewReports } from '@/types/auth'
import { toProduct } from '@/types/inventory'

import type { PeriodKey } from '@/lib/date-boundaries'
import type { Metadata } from 'next'

export const instant = false

interface ProductDetailPageProps {
  params: Promise<{ locale: string; id: string }>
  searchParams?: Promise<{ period?: string; startDate?: string; endDate?: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('name, sku').eq('id', id).single()

  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: product ? `${product.name} (${product.sku}) | ${t('reports.productDetailTitle')}` : `Detail Produk | Inventra`,
    description: t('reports.productDetailSubtitle')
  }
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  await connection()
  const { locale, id } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  if (!canViewReports(profile.role)) {
    redirect(`/${locale}/dashboard`)
  }
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawPeriod = resolvedSearchParams.period as PeriodKey | undefined
  const validPeriods: PeriodKey[] = ['today', 'week', 'month', 'year', 'all', 'custom']
  const period: PeriodKey = rawPeriod && validPeriods.includes(rawPeriod) ? rawPeriod : 'week'

  const supabase = await createClient()

  let analyticsResult
  try {
    analyticsResult = await getProductMovementAnalytics(supabase, id, period, resolvedSearchParams.startDate, resolvedSearchParams.endDate)
  } catch {
    notFound()
  }

  const { product: rawProduct, summary, rawMovements } = analyticsResult
  const product = toProduct(rawProduct)

  return (
    <div className="space-y-6">
      {/* Product Identity Header */}
      <ProductDetailHeader product={product} locale={locale} backLabel={tDashboard('reports.backToProducts')} />

      {/* Analytics Period Toolbar */}
      <PeriodFilter currentPeriod={period} startDate={resolvedSearchParams.startDate} endDate={resolvedSearchParams.endDate} />

      {/* Product Period Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Current Physical Stock */}
        <KpiStatCard
          title={tDashboard('reports.currentStock')}
          value={`${formatNumber(product.stock, locale)} ${product.unit}`}
          description="Kuantitas fisik riil tersedia di gudang"
          icon={Boxes}
          variant="secondary"
        />

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
          variant="default"
        />
      </div>

      {/* Movement Flow Chart for this Product */}
      <MovementFlowChart
        data={summary.buckets}
        title={`Arus Mutasi: ${product.name}`}
        subtitle={`Grafik pergerakan stok masuk vs keluar untuk SKU ${product.sku}`}
        inLabel={tDashboard('analytics.inLabel')}
        outLabel={tDashboard('analytics.outLabel')}
        emptyMessage={tDashboard('reports.emptyProductMovements')}
      />

      {/* Product Mutation Ledger */}
      <ProductDetailLedger movements={rawMovements} locale={locale} />
    </div>
  )
}
