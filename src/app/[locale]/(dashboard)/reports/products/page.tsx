import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowRight, LineChart, Package } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface ProductAnalysisPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ProductAnalysisPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.productAnalysis')} | Inventra`,
    description: 'Analisis perputaran dan tren performa produk individual'
  }
}

export default async function ProductAnalysisPage({ params }: ProductAnalysisPageProps) {
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
            <LineChart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tSidebar('items.productAnalysis')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Analisis kecepatan mutasi (fast/slow moving) dan riwayat produk spesifik</p>
          </div>
        </div>

        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent self-start text-xs sm:self-auto">
          Batch 3 Feature Roadmap
        </Badge>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold">Modul Analisis Performa Produk (Direncanakan Batch 3)</CardTitle>
          <CardDescription className="text-xs">
            Laporan individual per-SKU (`/inventory/[id]`) dan metrik velocity stok dijadwalkan untuk Batch 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Data katalog produk dan riwayat mutasi pergerakan stok dapat diakses melalui modul <strong>Katalog Produk</strong> dan{' '}
            <strong>Riwayat Mutasi</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/${locale}/inventory`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Buka Katalog Produk</span>
              </Button>
            </Link>
            <Link href={`/${locale}/movements`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <span>Riwayat Mutasi Stok</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
