import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight, History } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { StockMovementWithDetails } from '@/types/inventory'

interface RecentMovementsCardProps {
  movements: StockMovementWithDetails[]
  locale: string
}

export async function RecentMovementsCard({ movements, locale }: RecentMovementsCardProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(isoString))
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="text-primary h-4 w-4" aria-hidden="true" />
            <CardTitle className="text-foreground text-base font-bold">{t('tables.recentActivity')}</CardTitle>
          </div>
          <CardDescription className="text-xs">{movements.length > 0 ? t('recentMovements.subtitleCount') : t('tables.emptyState')}</CardDescription>
        </div>

        <Link href={`/${locale}/movements`}>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
            <span>{t('catalog.viewAllMovements')}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {movements.length === 0 ? (
          <div className="border-border bg-muted/20 text-muted-foreground flex flex-col items-center justify-center rounded-lg border p-6 text-center text-xs">
            <History className="text-muted-foreground/60 mb-2 h-8 w-8" aria-hidden="true" />
            <p className="font-medium">{t('tables.emptyState')}</p>
          </div>
        ) : (
          <div className="border-border w-full overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2.5 whitespace-nowrap">{t('recentMovements.time')}</TableHead>
                  <TableHead className="py-2.5 whitespace-nowrap">{t('recentMovements.product')}</TableHead>
                  <TableHead className="py-2.5 text-center whitespace-nowrap">{t('recentMovements.type')}</TableHead>
                  <TableHead className="py-2.5 text-right whitespace-nowrap">{t('recentMovements.quantity')}</TableHead>
                  <TableHead className="hidden py-2.5 text-right whitespace-nowrap sm:table-cell">{t('recentMovements.finalStock')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const isIn = m.type === 'IN'
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/20">
                      <TableCell className="text-muted-foreground py-2.5 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(m.createdAt)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="min-w-0">
                          <span className="text-primary block font-mono text-xs font-bold">{m.product.sku}</span>
                          <span className="text-foreground block max-w-35 truncate text-xs font-medium sm:max-w-50">{m.product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-center whitespace-nowrap">
                        {isIn ? (
                          <Badge variant="success" className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px]">
                            <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                            <span>IN</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px]">
                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            <span>OUT</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                          {isIn ? `+${m.quantity}` : `-${m.quantity}`} {m.product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden py-2.5 text-right font-mono text-xs whitespace-nowrap sm:table-cell">
                        {m.stockAfter} unit
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
