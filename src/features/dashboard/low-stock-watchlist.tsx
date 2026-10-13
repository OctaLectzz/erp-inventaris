import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { Product } from '@/types/inventory'

interface LowStockWatchlistProps {
  products: Product[]
  locale: string
  isAdmin?: boolean
}

export async function LowStockWatchlist({ products, locale }: LowStockWatchlistProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-foreground text-base font-bold">{t('watchlist.title')}</CardTitle>
            {products.length > 0 && (
              <Badge variant="destructive" className="px-2 py-0.5 text-[10px]">
                {products.length} {t('watchlist.badgeWarning')}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">{t('watchlist.subtitle')}</CardDescription>
        </div>

        <Link href={`/${locale}/inventory`}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
            <span>{t('watchlist.viewCatalog')}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {products.length === 0 ? (
          <div className="border-border bg-muted/20 text-muted-foreground flex items-center gap-2.5 rounded-lg border p-4 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{t('watchlist.empty')}</span>
          </div>
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2.5">SKU</TableHead>
                  <TableHead className="py-2.5">Nama Produk</TableHead>
                  <TableHead className="py-2.5 text-right">Harga Satuan</TableHead>
                  <TableHead className="py-2.5 text-right">Sisa Stok</TableHead>
                  <TableHead className="py-2.5 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="text-primary py-2.5 font-mono font-bold whitespace-nowrap">{p.sku}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="min-w-0">
                        <span className="text-foreground block max-w-35 truncate font-semibold sm:max-w-50">{p.name}</span>
                        <span className="text-muted-foreground block text-[10px] uppercase">{p.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-xs font-medium whitespace-nowrap">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-destructive py-2.5 text-right font-mono font-bold whitespace-nowrap">
                      {p.stock} {p.unit}
                    </TableCell>
                    <TableCell className="py-2.5 text-center whitespace-nowrap">
                      <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px]">
                        <AlertTriangle className="mr-1 h-2.5 w-2.5" aria-hidden="true" />
                        Kritis (&lt; 5)
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
