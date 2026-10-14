import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowRight, BarChart3, LayoutDashboard } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface ReportsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ReportsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.reports')} | Inventra`,
    description: 'Analitik pergerakan stok dan laporan inventaris'
  }
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  await requireAuth(locale)
  const tSidebar = await getTranslations({ locale, namespace: 'sidebar' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tSidebar('items.reports')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Laporan ringkasan dan analitik agregasi stok gudang</p>
          </div>
        </div>

        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent self-start text-xs sm:self-auto">
          Batch 3 Feature Roadmap
        </Badge>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold">Modul Analitik & Laporan Lanjutan (Direncanakan Batch 3)</CardTitle>
          <CardDescription className="text-xs">
            Visualisasi grafik tren mutasi stok masuk vs keluar harian serta filter rentang waktu analitik dijadwalkan untuk Batch 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Metrik agregasi langsung, valuasi total aset stok, dan ringkasan transaksi terbaru dapat dipantau langsung melalui{' '}
            <strong>Dashboard Utama</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/${locale}/dashboard`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Buka Dashboard Utama</span>
              </Button>
            </Link>
            <Link href={`/${locale}/movements`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <span>Lihat Riwayat Mutasi</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
