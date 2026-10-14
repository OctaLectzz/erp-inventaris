'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { useIsMounted } from '@/hooks/use-is-mounted'
import { cn } from '@/lib/utils'

import type { MiniSparklineProps } from './chart-types'

export function MiniSparkline({ data, width = 80, height = 24, color = '#0d9488', className, ariaLabel = 'Tren data mutasi' }: MiniSparklineProps) {
  const mounted = useIsMounted()

  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  const chartData = data.map((val, idx) => ({ idx, val }))
  const strokeColor = color.startsWith('#')
    ? color
    : color.includes('accent')
      ? '#0d9488'
      : color.includes('rose') || color.includes('destructive')
        ? '#e11d48'
        : '#0d9488'

  if (!mounted) {
    return <div style={{ width, height }} className={cn('shrink-0', className)} aria-label={ariaLabel} />
  }

  return (
    <div style={{ width, height }} className={cn('shrink-0 overflow-hidden', className)} aria-label={ariaLabel} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="val" stroke={strokeColor} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
