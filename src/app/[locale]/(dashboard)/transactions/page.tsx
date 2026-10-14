import Link from 'next/link'
import { connection } from 'next/server'
import { ArrowDownUp, ArrowRight, Package } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface TransactionsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TransactionsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.transactions')} | Inventra`,
    description: 'Pencatatan dan eksekusi transaksi mutasi inventaris'
  }
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
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
            <ArrowDownUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tSidebar('items.transactions')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Antarmuka formulir transaksi langsung dan keranjang multi-item</p>
          </div>
        </div>

        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent self-start text-xs sm:self-auto">
          Batch 2 Feature Roadmap
        </Badge>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold">Modul Transaksi Keranjang Multi-Item (Direncanakan Batch 2)</CardTitle>
          <CardDescription className="text-xs">
            Arsitektur transaksi stok multi-item dengan RPC PostgreSQL batch sedang disiapkan untuk Batch 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Untuk saat ini, mutasi stok fisik dapat dicatat secara aman per produk melalui tombol <strong>Catat Mutasi</strong> di halaman Riwayat
            Mutasi atau melalui tabel Katalog Produk.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/${locale}/movements`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <span>Buka Riwayat & Mutasi Stok</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href={`/${locale}/inventory`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Lihat Katalog Produk</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
