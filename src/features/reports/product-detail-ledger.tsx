'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Filter, PackageX } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProductMovementRow {
  id: string
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  note: string
  created_at: string
}

interface ProductDetailLedgerProps {
  movements: ProductMovementRow[]
  locale: string
}

export function ProductDetailLedger({ movements, locale }: ProductDetailLedgerProps) {
  const t = useTranslations('dashboard')
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | 'IN' | 'OUT'>('ALL')
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  const filtered = React.useMemo(() => {
    if (typeFilter === 'ALL') return movements
    return movements.filter((m) => m.type === typeFilter)
  }, [movements, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <CardTitle className="text-foreground text-sm font-bold">{t('reports.movementHistory')}</CardTitle>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'ALL' | 'IN' | 'OUT')
              setCurrentPage(1)
            }}
            className="border-input bg-background text-foreground h-8 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
            aria-label="Filter jenis mutasi"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="IN">Stok Masuk (IN)</option>
            <option value="OUT">Stok Keluar (OUT)</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <PackageX className="text-muted-foreground mb-2 h-8 w-8" aria-hidden="true" />
            <p className="text-foreground text-xs font-semibold">{t('reports.emptyProductMovements')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-border bg-muted/40 text-muted-foreground border-y font-semibold">
                    <th className="px-4 py-2.5">Waktu Transaksi</th>
                    <th className="px-4 py-2.5 text-center">Tipe</th>
                    <th className="px-4 py-2.5 text-right">Kuantitas</th>
                    <th className="px-4 py-2.5 text-center">Stok Sebelum → Sesudah</th>
                    <th className="px-4 py-2.5">Catatan / Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {paginated.map((m) => {
                    const isIn = m.type === 'IN'
                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="text-muted-foreground px-4 py-3 font-mono text-[11px] whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isIn ? (
                            <Badge variant="default" className="gap-1 bg-emerald-600/90 text-[10px] text-white">
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                              <span>IN</span>
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1 text-[10px]">
                              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                              <span>OUT</span>
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
                          <span className={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs whitespace-nowrap">
                          <span className="text-muted-foreground">{m.stock_before}</span>
                          <span className="text-muted-foreground/60 mx-1">→</span>
                          <span className="text-foreground font-bold">{m.stock_after}</span>
                        </td>
                        <td className="text-muted-foreground max-w-sm px-4 py-3 text-xs">
                          <p className="line-clamp-2">{m.note}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-3 text-xs">
                <span className="text-muted-foreground">
                  Halaman {currentPage} dari {totalPages} ({filtered.length} total transaksi)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-7 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-7 text-xs"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
