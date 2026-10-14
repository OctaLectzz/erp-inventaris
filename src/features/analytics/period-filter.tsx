'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { PeriodKey } from '@/lib/date-boundaries'

interface PeriodFilterProps {
  currentPeriod: PeriodKey
  startDate?: string
  endDate?: string
  className?: string
}

export function PeriodFilter({ currentPeriod, startDate = '', endDate = '', className }: PeriodFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('dashboard')

  const [isCustom, setIsCustom] = React.useState(currentPeriod === 'custom')
  const [customStart, setCustomStart] = React.useState(startDate)
  const [customEnd, setCustomEnd] = React.useState(endDate)

  const periods: { key: PeriodKey; labelKey: string }[] = [
    { key: 'today', labelKey: 'analytics.periods.today' },
    { key: 'week', labelKey: 'analytics.periods.week' },
    { key: 'month', labelKey: 'analytics.periods.month' },
    { key: 'year', labelKey: 'analytics.periods.year' },
    { key: 'all', labelKey: 'analytics.periods.all' },
    { key: 'custom', labelKey: 'analytics.periods.custom' }
  ]

  const handlePeriodSelect = (period: PeriodKey) => {
    if (period === 'custom') {
      setIsCustom(true)
      return
    }

    setIsCustom(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    params.delete('startDate')
    params.delete('endDate')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', 'custom')
    params.set('startDate', customStart)
    params.set('endDate', customEnd)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      className={cn(
        'border-border bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="text-muted-foreground mr-1.5 flex items-center gap-1.5 text-xs font-semibold">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('analytics.periodLabel')}:</span>
        </div>

        {periods.map((p) => {
          const isActive = currentPeriod === p.key
          return (
            <Button
              key={p.key}
              variant={isActive ? 'default' : 'outline'}
              size="xs"
              onClick={() => handlePeriodSelect(p.key)}
              className={cn(
                'h-7 rounded-md text-xs font-medium transition-all',
                isActive && 'bg-primary text-primary-foreground font-semibold shadow-xs'
              )}
            >
              {t(p.labelKey)}
            </Button>
          )
        })}
      </div>

      {isCustom && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-7 w-32 text-xs"
              aria-label="Tanggal Awal"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-7 w-32 text-xs"
              aria-label="Tanggal Akhir"
            />
          </div>
          <Button size="xs" onClick={handleApplyCustom} disabled={!customStart || !customEnd} className="h-7 text-xs font-semibold">
            {t('analytics.applyFilter')}
          </Button>
        </div>
      )}
    </div>
  )
}
