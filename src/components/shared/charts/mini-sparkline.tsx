'use client'

import { cn } from '@/lib/utils'

import type { MiniSparklineProps } from './chart-types'

export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color = 'stroke-accent',
  className,
  ariaLabel = 'Tren data mutasi'
}: MiniSparklineProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return null
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const padding = 2
  const effectiveW = width - padding * 2
  const effectiveH = height - padding * 2

  const points = data.map((val, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * effectiveW
    const y = padding + effectiveH - ((val - min) / range) * effectiveH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pointsStr = points.join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0 overflow-visible', className)}
      role="img"
      aria-label={ariaLabel}
    >
      <polyline fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" points={pointsStr} className={color} />
      {/* End dot for latest value */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={2}
          className={cn('fill-current', color.replace('stroke-', 'text-'))}
        />
      )}
    </svg>
  )
}
