'use client'

import { Calendar, Filter, Plus, RotateCcw, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface MovementFiltersProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedType: 'ALL' | 'IN' | 'OUT'
  onTypeChange: (type: 'ALL' | 'IN' | 'OUT') => void
  startDate: string
  onStartDateChange: (d: string) => void
  endDate: string
  onEndDateChange: (d: string) => void
  onReset: () => void
  onOpenMutationDialog?: () => void
  isAdmin: boolean
  showingCount: number
  totalCount: number
}

export function MovementFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  onOpenMutationDialog,
  isAdmin,
  showingCount,
  totalCount
}: MovementFiltersProps) {
  const t = useTranslations('dashboard')
  const hasActiveFilters = Boolean(searchQuery || selectedType !== 'ALL' || startDate || endDate)

  return (
    <Card className="border-border">
      <CardHeader className="p-4 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t('movements.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filter Controls & Action Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value as 'ALL' | 'IN' | 'OUT')}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs focus:ring-1 focus:outline-hidden"
                aria-label="Filter tipe mutasi"
              >
                <option value="ALL">{t('movements.allTypes')}</option>
                <option value="IN">{t('movements.typeIn')}</option>
                <option value="OUT">{t('movements.typeOut')}</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-9 w-36 text-xs"
                aria-label={t('movements.startDate')}
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-9 w-36 text-xs"
                aria-label={t('movements.endDate')}
              />
            </div>

            {/* Record Mutation Button */}
            {isAdmin && onOpenMutationDialog && (
              <Button
                size="sm"
                onClick={onOpenMutationDialog}
                className="h-9 gap-1.5 bg-primary text-xs text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('movements.recordMutation')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary & Active Filters */}
        <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
          <span>
            {t('movements.showingResults', {
              count: showingCount,
              total: totalCount
            })}
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="xs" onClick={onReset} className="h-6 gap-1 text-[11px] text-primary hover:underline">
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>{t('movements.resetFilter')}</span>
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
