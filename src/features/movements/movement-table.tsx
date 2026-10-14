'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackageX, RotateCcw, ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MovementFilters } from '@/features/movements/movement-filters'
import { MovementMobileCard, MovementTableRow } from '@/features/movements/movement-row-items'
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
  const isAdmin = userRole === 'admin_gudang' || userRole === 'administrator'

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
      {/* Read-Only Notice for Non-Admin */}
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

      {/* Filter and Control Bar */}
      <MovementFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q)
          setCurrentPage(1)
        }}
        selectedType={selectedType}
        onTypeChange={(tp) => {
          setSelectedType(tp)
          setCurrentPage(1)
        }}
        startDate={startDate}
        onStartDateChange={(d) => {
          setStartDate(d)
          setCurrentPage(1)
        }}
        endDate={endDate}
        onEndDateChange={(d) => {
          setEndDate(d)
          setCurrentPage(1)
        }}
        onReset={handleResetFilters}
        onOpenMutationDialog={() => setDialogOpen(true)}
        isAdmin={isAdmin}
        showingCount={paginatedMovements.length}
        totalCount={filteredMovements.length}
      />

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
          {/* Desktop Table View */}
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
                {paginatedMovements.map((m) => (
                  <MovementTableRow key={m.id} movement={m} formatDateTime={formatDateTime} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {paginatedMovements.map((m) => (
              <MovementMobileCard key={m.id} movement={m} formatDateTime={formatDateTime} />
            ))}
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
        <StockMutationDialog open={dialogOpen} onOpenChange={setDialogOpen} products={products} locale={locale} onSuccess={() => router.refresh()} />
      )}
    </div>
  )
}
