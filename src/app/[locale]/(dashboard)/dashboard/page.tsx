import { AlertTriangle, ArrowRight, Banknote, Boxes, CheckCircle2, Package, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getInventoryDashboardData } from '@/services/product-service'

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

  // Query live inventory metrics calculated via pure domain logic
  const supabase = await createClient()
  const { summary, lowStockProducts } = await getInventoryDashboardData(supabase)

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
          <span>Fase 7 Aktif: Dashboard &amp; Katalog Terpadu</span>
        </div>
      </div>

      {/* Role Authorization Status Banner */}
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
            <div className="text-foreground text-2xl font-bold tracking-tight">{formatNumber(summary.totalSkus)}</div>
            <p className="text-muted-foreground mt-1 text-xs">SKU unik terdaftar di sistem</p>
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
            <div className="text-foreground text-2xl font-bold tracking-tight">{formatNumber(summary.totalUnits)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Unit fisik tersedia di gudang</p>
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
            <div className="text-primary text-2xl font-bold tracking-tight">{formatCurrency(summary.totalInventoryValue)}</div>
            <p className="text-muted-foreground mt-1 text-xs">&sum; (stok &times; harga) seluruh item</p>
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
            <div className="text-destructive text-2xl font-bold tracking-tight">{formatNumber(summary.lowStockCount)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Item dengan stok &lt; 5 unit</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Watchlist Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-foreground text-base font-bold">{tDashboard('watchlist.title')}</CardTitle>
              {summary.lowStockCount > 0 && (
                <Badge variant="destructive" className="text-[11px]">
                  {summary.lowStockCount} {tDashboard('watchlist.badgeWarning')}
                </Badge>
              )}
            </div>
            <CardDescription>{tDashboard('watchlist.subtitle')}</CardDescription>
          </div>

          <Link href={`/${locale}/inventory`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <span>{tDashboard('watchlist.viewCatalog')}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="border-border bg-muted/20 text-muted-foreground flex items-center gap-2.5 rounded-lg border p-4 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span>{tDashboard('watchlist.empty')}</span>
            </div>
          ) : (
            <div className="border-border overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-border bg-muted/50 text-muted-foreground border-b font-semibold">
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Nama Produk</th>
                    <th className="px-4 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                    <th className="px-4 py-2.5 text-right">Sisa Stok</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="text-primary px-4 py-2.5 font-mono font-bold">{p.sku}</td>
                      <td className="text-foreground px-4 py-2.5 font-semibold">{p.name}</td>
                      <td className="text-muted-foreground px-4 py-2.5 uppercase">{p.category}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(p.price)}</td>
                      <td className="text-destructive px-4 py-2.5 text-right font-mono font-bold">{p.stock} unit</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          Kritis (&lt; 5)
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Verification Status Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary text-base font-bold">Ringkasan Keamanan &amp; Otorisasi Sesi (Fase 7)</CardTitle>
          <CardDescription>Validasi kontrol akses berbasis peran (RBAC) dan imutabilitas stok katalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Stock Immutability Guard</p>
                <p className="text-muted-foreground">Form katalog tidak memuat kolom stok; perubahan stok hanya via RPC mutasi.</p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Authoritative Profile Source</p>
                <p className="text-muted-foreground">
                  Peran diverifikasi langsung dari <code>public.profiles</code> pada server boundary.
                </p>
              </div>
            </div>

            <div className="border-border bg-card flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-foreground font-semibold">Executive Owner Boundary</p>
                <p className="text-muted-foreground">Peran Owner dibatasi secara mutlak untuk hanya-baca pada katalog dan dashboard.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
