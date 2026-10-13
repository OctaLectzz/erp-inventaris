'use client'

import { ArrowDownRight, ArrowUpRight, Calendar, Filter, PackageX, Plus, RotateCcw, Search, ShieldAlert, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StockMutationDialog } from '@/features/movements/stock-mutation-dialog'

import type { ProductOption } from '@/features/movements/stock-mutation-dialog'
import type { StockMovementWithDetails } from '@/types/inventory'

interface MovementTableProps {
  initialMovements: StockMovementWithDetails[]
  products: ProductOption[]
  userRole: string
  locale: string
}

export function MovementTable({ initialMovements, products, userRole, locale }: MovementTableProps) {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const isAdmin = userRole === 'admin_gudang'

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'ALL' | 'IN' | 'OUT'>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)

  // Symmetrical filter pipeline
  const filteredMovements = useMemo(() => {
    return initialMovements.filter((m) => {
      // 1. Search Query (SKU or Name or Note)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase()
        const matchesSku = m.product.sku.toLowerCase().includes(q)
        const matchesName = m.product.name.toLowerCase().includes(q)
        const matchesNote = m.note.toLowerCase().includes(q)
        if (!matchesSku && !matchesName && !matchesNote) {
          return false
        }
      }

      // 2. Type Filter
      if (selectedType !== 'ALL' && m.type !== selectedType) {
        return false
      }

      // 3. Start Date Filter
      if (startDate) {
        const movementDate = new Date(m.createdAt)
        const filterStart = new Date(`${startDate}T00:00:00.000`)
        if (movementDate < filterStart) {
          return false
        }
      }

      // 4. End Date Filter
      if (endDate) {
        const movementDate = new Date(m.createdAt)
        const filterEnd = new Date(`${endDate}T23:59:59.999`)
        if (movementDate > filterEnd) {
          return false
        }
      }

      return true
    })
  }, [initialMovements, searchQuery, selectedType, startDate, endDate])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredMovements.slice(startIndex, startIndex + pageSize)
  }, [filteredMovements, currentPage, pageSize])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedType('ALL')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const handleMutationSuccess = () => {
    router.refresh()
  }

  // Localized date formatter
  const formatDateTime = (isoString: string): string => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-4">
      {/* Read-Only Notice for Owner */}
      {!isAdmin && (
        <div className="border-primary/20 bg-secondary/50 text-foreground flex items-center justify-between rounded-lg border p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('movements.readOnlyNotice')}</span>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Mode Audit
          </Badge>
        </div>
      )}

      {/* Filter and Control Card */}
      <Card className="border-border">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" aria-hidden="true" />
              <Input
                placeholder={t('movements.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter Controls & Action Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as 'ALL' | 'IN' | 'OUT')
                    setCurrentPage(1)
                  }}
                  className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
                  aria-label="Filter tipe mutasi"
                >
                  <option value="ALL">{t('movements.allTypes')}</option>
                  <option value="IN">{t('movements.typeIn')}</option>
                  <option value="OUT">{t('movements.typeOut')}</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-1.5">
                <Calendar className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-9 w-36 text-xs"
                  aria-label={t('movements.startDate')}
                />
              </div>

              {/* End Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-9 w-36 text-xs"
                  aria-label={t('movements.endDate')}
                />
              </div>

              {/* Record Mutation Button (admin_gudang only) */}
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-1.5 text-xs shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('movements.recordMutation')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary & Active Filters */}
          <div className="text-muted-foreground mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
            <span>
              {t('movements.showingResults', {
                count: paginatedMovements.length,
                total: filteredMovements.length
              })}
            </span>
            {(searchQuery || selectedType !== 'ALL' || startDate || endDate) && (
              <Button variant="ghost" size="xs" onClick={handleResetFilters} className="text-primary h-6 gap-1 text-[11px] hover:underline">
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{t('movements.resetFilter')}</span>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Movement History Table or Empty State */}
      {filteredMovements.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-secondary text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <PackageX className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-foreground text-sm font-semibold">{t('movements.emptySearch')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">{t('movements.emptySubtitle')}</p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('movements.resetFilter')}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="border-border bg-card hidden overflow-x-auto rounded-lg border shadow-xs md:block">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-border bg-muted/50 text-muted-foreground border-b font-semibold">
                  <th className="px-4 py-3">{t('movements.columns.timestamp')}</th>
                  <th className="px-4 py-3">{t('movements.columns.sku')}</th>
                  <th className="px-4 py-3">{t('movements.columns.product')}</th>
                  <th className="px-4 py-3 text-center">{t('movements.columns.type')}</th>
                  <th className="px-4 py-3 text-right">{t('movements.columns.quantity')}</th>
                  <th className="px-4 py-3 text-center">{t('movements.columns.stockBeforeAfter')}</th>
                  <th className="px-4 py-3">{t('movements.columns.user')}</th>
                  <th className="px-4 py-3">{t('movements.columns.note')}</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {paginatedMovements.map((m) => {
                  const isIn = m.type === 'IN'
                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      {/* Timestamp */}
                      <td className="text-muted-foreground px-4 py-3 font-mono text-[11px] whitespace-nowrap">{formatDateTime(m.createdAt)}</td>

                      {/* SKU */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-primary font-mono text-xs font-bold">{m.product.sku}</span>
                      </td>

                      {/* Product Name & Category */}
                      <td className="px-4 py-3">
                        <p className="text-foreground max-w-xs truncate font-semibold">{m.product.name}</p>
                        <span className="text-muted-foreground font-mono text-[10px] uppercase">{m.product.category}</span>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isIn ? (
                          <Badge variant="default" className="gap-1 bg-emerald-600/90 text-[10px] text-white hover:bg-emerald-600">
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

                      {/* Quantity */}
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
                        <span className={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>

                      {/* Stock Transition (Before -> After) */}
                      <td className="px-4 py-3 text-center font-mono text-xs whitespace-nowrap">
                        <span className="text-muted-foreground">{m.stockBefore}</span>
                        <span className="text-muted-foreground/60 mx-1">→</span>
                        <span className="text-foreground font-bold">{m.stockAfter}</span>
                      </td>

                      {/* User Attribution */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                          <span className="text-foreground font-medium">{m.user?.fullName || 'Admin Gudang'}</span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="text-muted-foreground max-w-xs px-4 py-3 text-xs">
                        <p className="line-clamp-2">{m.note}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {paginatedMovements.map((m) => {
              const isIn = m.type === 'IN'
              return (
                <Card key={m.id} className="border-border">
                  <CardContent className="space-y-2.5 p-4 text-xs">
                    {/* Header Row: Type Badge + Timestamp */}
                    <div className="flex items-center justify-between">
                      {isIn ? (
                        <Badge variant="default" className="gap-1 bg-emerald-600 text-[10px] text-white">
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                          <span>STOK MASUK (IN)</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                          <span>STOK KELUAR (OUT)</span>
                        </Badge>
                      )}
                      <span className="text-muted-foreground font-mono text-[10px]">{formatDateTime(m.createdAt)}</span>
                    </div>

                    {/* Product Info */}
                    <div>
                      <span className="text-primary font-mono text-xs font-bold">{m.product.sku}</span>
                      <h4 className="text-foreground font-semibold">{m.product.name}</h4>
                    </div>

                    {/* Stock & Quantity Grid */}
                    <div className="border-border bg-muted/30 grid grid-cols-2 gap-2 rounded-md border p-2 font-mono text-[11px]">
                      <div>
                        <span className="text-muted-foreground text-[10px]">Kuantitas: </span>
                        <strong className={isIn ? 'text-emerald-600' : 'text-rose-600'}>{isIn ? `+${m.quantity}` : `-${m.quantity}`} unit</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground text-[10px]">Stok: </span>
                        <span>
                          {m.stockBefore} → <strong>{m.stockAfter}</strong>
                        </span>
                      </div>
                    </div>

                    {/* User and Note */}
                    <div className="border-t pt-2 text-[11px]">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3 w-3" aria-hidden="true" />
                        <span>Oleh: {m.user?.fullName || 'Admin Gudang'}</span>
                      </div>
                      <p className="text-muted-foreground mt-1 italic">&ldquo;{m.note}&rdquo;</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t py-2 text-xs">
              <span className="text-muted-foreground">{t('movements.pagination.page', { current: currentPage, total: totalPages })}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 text-xs"
                >
                  {t('movements.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 text-xs"
                >
                  {t('movements.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stock Mutation Dialog */}
      {isAdmin && (
        <StockMutationDialog open={dialogOpen} onOpenChange={setDialogOpen} products={products} locale={locale} onSuccess={handleMutationSuccess} />
      )}
    </div>
  )
}
