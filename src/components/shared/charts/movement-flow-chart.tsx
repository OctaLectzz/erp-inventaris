'use client'

import * as React from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { MovementChartProps } from './chart-types'

export function MovementFlowChart({
  data,
  title = 'Arus Mutasi Stok (IN vs OUT)',
  subtitle = 'Perbandingan volume unit barang masuk dan keluar per interval waktu',
  inLabel = 'Stok Masuk (IN)',
  outLabel = 'Stok Keluar (OUT)',
  emptyMessage = 'Belum ada data pergerakan stok pada periode ini.',
  className
}: MovementChartProps) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null)

  const hasData = React.useMemo(() => {
    return data.some((d) => d.inQuantity > 0 || d.outQuantity > 0)
  }, [data])

  const maxVal = React.useMemo(() => {
    let m = 1
    for (const d of data) {
      if (d.inQuantity > m) m = d.inQuantity
      if (d.outQuantity > m) m = d.outQuantity
    }
    return Math.ceil(m * 1.15) // 15% headroom
  }, [data])

  const chartW = 540
  const chartH = 140
  const marginL = 40
  const marginT = 15

  const barGroupWidth = data.length > 0 ? chartW / data.length : 0
  const singleBarW = Math.max(3, Math.min(14, barGroupWidth * 0.35))

  const activeBucket = activeIdx !== null && data[activeIdx] ? data[activeIdx] : null

  return (
    <Card className={cn('border-border shadow-2xs', className)}>
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-foreground text-sm font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-teal-500 dark:bg-teal-400" />
            <span className="text-muted-foreground">{inLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-500 dark:bg-rose-400" />
            <span className="text-muted-foreground">{outLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Active Tooltip Banner */}
        <div className="min-h-[1.75rem] pb-2 text-xs">
          {activeBucket ? (
            <div className="border-border bg-muted/40 inline-flex items-center gap-3 rounded-md border px-2.5 py-1">
              <span className="text-foreground font-semibold">{activeBucket.label}:</span>
              <span className="font-medium text-teal-600 dark:text-teal-400">+{activeBucket.inQuantity} IN</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">-{activeBucket.outQuantity} OUT</span>
              <span className="text-muted-foreground">(Net: {activeBucket.netFlow > 0 ? `+${activeBucket.netFlow}` : activeBucket.netFlow})</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-[11px]">Arahkan kursor pada batang grafik untuk rincian kuantitas.</p>
          )}
        </div>

        {!hasData ? (
          <div className="text-muted-foreground flex h-[160px] flex-col items-center justify-center rounded-lg border border-dashed text-xs">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-1">
            <svg viewBox="0 0 600 190" className="h-auto w-full min-w-[500px]" role="img" aria-label={title}>
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {[0, 0.5, 1].map((pct, i) => {
                const y = marginT + chartH * (1 - pct)
                const val = Math.round(maxVal * pct)
                return (
                  <g key={i}>
                    <line
                      x1={marginL}
                      y1={y}
                      x2={marginL + chartW}
                      y2={y}
                      className="stroke-border/50"
                      strokeDasharray={pct > 0 ? '3 3' : undefined}
                      strokeWidth={1}
                    />
                    <text x={marginL - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[9px]">
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* Data Bars */}
              {data.map((d, idx) => {
                const groupX = marginL + idx * barGroupWidth
                const centerX = groupX + barGroupWidth / 2
                const inHeight = (d.inQuantity / maxVal) * chartH
                const outHeight = (d.outQuantity / maxVal) * chartH
                const inY = marginT + (chartH - inHeight)
                const outY = marginT + (chartH - outHeight)
                const isHovered = activeIdx === idx

                return (
                  <g
                    key={d.key || idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                    className="cursor-pointer transition-opacity"
                    opacity={activeIdx === null || isHovered ? 1 : 0.45}
                  >
                    {/* IN Bar */}
                    <rect
                      x={centerX - singleBarW - 1}
                      y={inY}
                      width={singleBarW}
                      height={Math.max(1, inHeight)}
                      rx={2}
                      className="fill-teal-500 transition-all hover:fill-teal-400 dark:fill-teal-400"
                    />

                    {/* OUT Bar */}
                    <rect
                      x={centerX + 1}
                      y={outY}
                      width={singleBarW}
                      height={Math.max(1, outHeight)}
                      rx={2}
                      className="fill-rose-500 transition-all hover:fill-rose-400 dark:fill-rose-400"
                    />

                    {/* X-Axis Date Label */}
                    <text
                      x={centerX}
                      y={marginT + chartH + 16}
                      textAnchor="middle"
                      className={cn('fill-muted-foreground text-[9px]', isHovered && 'fill-primary font-bold')}
                    >
                      {d.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
