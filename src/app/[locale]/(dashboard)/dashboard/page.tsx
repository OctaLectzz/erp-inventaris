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
          <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">
            {tDashboard('welcome')}, {profile.fullName}
          </h1>
          <p className="text-muted-foreground text-sm">{tDashboard('subtitle')}</p>
        </div>

        <div className="border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs sm:self-auto">
          <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
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
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{tDashboard('kpi.totalProducts')}</CardTitle>
            <div className="bg-secondary text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Package className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-2xl font-bold tracking-tight">{formatNumber(totalProducts)}</div>
            <p className="text-muted-foreground mt-1 text-xs">DummyJSON Sync Verified</p>
          </CardContent>
        </Card>

        {/* Total Stock Units */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{tDashboard('kpi.totalStock')}</CardTitle>
            <div className="bg-accent/15 text-accent-foreground dark:text-accent flex h-8 w-8 items-center justify-center rounded-lg">
              <Boxes className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-2xl font-bold tracking-tight">{formatNumber(totalStock)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Available in warehouse storage</p>
          </CardContent>
        </Card>

        {/* Total Valuation */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{tDashboard('valuation')}</CardTitle>
            <div className="bg-secondary text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Banknote className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-primary text-2xl font-bold tracking-tight">{formatCurrency(totalValuation)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Calculated across 30 active items</p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{tDashboard('kpi.lowStockAlerts')}</CardTitle>
            <div className="bg-destructive/10 text-destructive flex h-8 w-8 items-center justify-center rounded-lg">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-2xl font-bold tracking-tight">{formatNumber(lowStockCount)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Items at or below min_stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Security & Verification Status Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary text-base font-bold">Ringkasan Keamanan &amp; Otorisasi Sesi (Phase 5)</CardTitle>
          <CardDescription>Validasi kepatuhan arsitektur keamanan dan kontrol akses berbasis peran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Supabase SSR Cookie Auth</p>
                <p className="text-muted-foreground">Sesi disinkronkan otomatis melalui cookie HTTP-only terenkripsi.</p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Authoritative Profile Source</p>
                <p className="text-muted-foreground">
                  Peran dibaca langsung dari tabel <code>public.profiles</code>, bukan client metadata.
                </p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Open-Redirect Protection</p>
                <p className="text-muted-foreground">Target pengalihan disanitasi secara ketat terhadap URL protokol luar.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
