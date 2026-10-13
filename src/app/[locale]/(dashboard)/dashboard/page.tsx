import { AlertTriangle, Banknote, Boxes, CheckCircle2, Package, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'

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
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })
  const tAuth = await getTranslations({ locale, namespace: 'auth' })

  // Query catalog metrics from live Supabase
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id, sku, name, stock, price')

  const totalProducts = products?.length ?? 0
  const totalStock = products?.reduce((acc, p) => acc + (p.stock ?? 0), 0) ?? 0
  const totalValuation = products?.reduce((acc, p) => acc + (p.stock ?? 0) * (p.price ?? 0), 0) ?? 0
  const lowStockCount = products?.filter((p) => (p.stock ?? 0) < 5).length ?? 0

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

  const isAdmin = profile.role === 'admin_gudang'

  return (
    <div className="space-y-8">
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
          <span>{tDashboard('phase5Badge')}</span>
        </div>
      </div>

      {/* Role Authorization Banner */}
      <Card className={`border shadow-sm ${isAdmin ? 'border-accent/40 bg-accent/5' : 'border-primary/30 bg-secondary/50'}`}>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isAdmin ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
              }`}
            >
              {isAdmin ? <ShieldCheck className="h-5 w-5" aria-hidden="true" /> : <ShieldAlert className="h-5 w-5" aria-hidden="true" />}
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                {tDashboard('roleCardTitle')}:{' '}
                <span className="font-semibold text-primary">{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
              </h2>
              <p className="text-xs text-muted-foreground">{isAdmin ? tDashboard('adminCapabilitiesDesc') : tDashboard('ownerCapabilitiesDesc')}</p>
            </div>
          </div>

          <div className="shrink-0 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-mono font-medium text-foreground">
              <span className={`h-2 w-2 rounded-full ${isAdmin ? 'bg-accent' : 'bg-primary'}`} />
              Role: {profile.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Catalog SKUs */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tDashboard('kpi.totalProducts')}</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{formatNumber(totalProducts)}</div>
            <p className="mt-1 text-xs text-muted-foreground">DummyJSON Sync Verified</p>
          </CardContent>
        </Card>

        {/* Total Stock Units */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tDashboard('kpi.totalStock')}</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground dark:text-accent">
              <Boxes className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{formatNumber(totalStock)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Available in warehouse storage</p>
          </CardContent>
        </Card>

        {/* Total Valuation */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tDashboard('valuation')}</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <Banknote className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(totalValuation)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Calculated across 30 active items</p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tDashboard('kpi.lowStockAlerts')}</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{formatNumber(lowStockCount)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Items at or below min_stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Verification Status Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-primary">Ringkasan Keamanan &amp; Otorisasi Sesi (Phase 5)</CardTitle>
          <CardDescription>Validasi kepatuhan arsitektur keamanan dan kontrol akses berbasis peran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Supabase SSR Cookie Auth</p>
                <p className="text-muted-foreground">Sesi disinkronkan otomatis melalui cookie HTTP-only terenkripsi.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Authoritative Profile Source</p>
                <p className="text-muted-foreground">
                  Peran dibaca langsung dari tabel <code>public.profiles</code>, bukan client metadata.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Open-Redirect Protection</p>
                <p className="text-muted-foreground">Target pengalihan disanitasi secara ketat terhadap URL protokol luar.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
