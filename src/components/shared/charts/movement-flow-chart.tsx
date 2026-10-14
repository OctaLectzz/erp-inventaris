'use client'

import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useIsMounted } from '@/hooks/use-is-mounted'
import { cn } from '@/lib/utils'

import type { MovementChartProps } from './chart-types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    color: string
    name: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const inVal = payload.find((p) => p.dataKey === 'inQuantity')?.value ?? 0
  const outVal = payload.find((p) => p.dataKey === 'outQuantity')?.value ?? 0
  const netFlow = inVal - outVal

  return (
    <div className="border-border bg-card/95 text-foreground z-50 min-w-[180px] rounded-xl border p-3 shadow-lg backdrop-blur-md">
      <p className="border-border text-foreground mb-2 border-b pb-1 text-xs font-bold">{label}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span className="font-medium">Stok Masuk (IN):</span>
          </div>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">+{inVal}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="font-medium">Stok Keluar (OUT):</span>
          </div>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-{outVal}</span>
        </div>

        <div className="border-border/60 flex items-center justify-between gap-3 border-t pt-1.5 text-[11px]">
          <span className="text-muted-foreground">Arus Bersih (Net):</span>
          <span
            className={cn(
              'font-mono font-bold',
              netFlow > 0 ? 'text-teal-600 dark:text-teal-400' : netFlow < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
            )}
          >
            {netFlow > 0 ? `+${netFlow}` : netFlow}
          </span>
        </div>
      </div>
    </div>
  )
}

export function MovementFlowChart({
  data,
  title = 'Arus Mutasi Stok (IN vs OUT)',
  subtitle = 'Perbandingan volume unit barang masuk dan keluar per interval waktu',
  inLabel = 'Stok Masuk (IN)',
  outLabel = 'Stok Keluar (OUT)',
  emptyMessage = 'Belum ada data pergerakan stok pada periode ini.',
  height = 280,
  className
}: MovementChartProps) {
  const mounted = useIsMounted()

  const hasData = React.useMemo(() => {
    return Array.isArray(data) && data.some((d) => (d.inQuantity ?? 0) > 0 || (d.outQuantity ?? 0) > 0)
  }, [data])

  const chartData = React.useMemo(() => {
    return (data || []).map((item) => ({
      key: item.key,
      label: item.label,
      inQuantity: item.inQuantity ?? 0,
      outQuantity: item.outQuantity ?? 0,
      netFlow: item.netFlow ?? (item.inQuantity ?? 0) - (item.outQuantity ?? 0)
    }))
  }, [data])

  const totalIn = React.useMemo(() => chartData.reduce((acc, cur) => acc + cur.inQuantity, 0), [chartData])
  const totalOut = React.useMemo(() => chartData.reduce((acc, cur) => acc + cur.outQuantity, 0), [chartData])

  return (
    <Card className={cn('border-border shadow-2xs', className)}>
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
            </div>
            <CardTitle className="text-foreground text-sm font-bold sm:text-base">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        </div>

        {/* Quick Aggregation Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 font-semibold text-teal-700 dark:text-teal-300">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{inLabel}:</span>
            <span className="font-mono font-bold">+{totalIn.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-700 dark:text-rose-300">
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{outLabel}:</span>
            <span className="font-mono font-bold">-{totalOut.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasData ? (
          <div className="border-border text-muted-foreground flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              <BarChart3 className="h-5 w-5 opacity-50" aria-hidden="true" />
            </div>
            <p className="font-medium">{emptyMessage}</p>
          </div>
        ) : !mounted ? (
          <div className="bg-muted/20 flex h-[260px] w-full animate-pulse items-center justify-center rounded-xl" />
        ) : (
          <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }} barGap={3} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: 'currentColor' }}
                  tickLine={false}
                  className="text-muted-foreground text-[10px] sm:text-xs"
                  dy={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className="text-muted-foreground text-[10px] sm:text-xs"
                  tickFormatter={(val: number) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  formatter={(value: string) => (
                    <span className="text-foreground text-xs font-medium">{value === 'inQuantity' ? inLabel : outLabel}</span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="inQuantity" name="inQuantity" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="outQuantity" name="outQuantity" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
