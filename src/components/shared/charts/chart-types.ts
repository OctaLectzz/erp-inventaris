import type { AnalyticsTimeBucket } from '@/services/analytics-domain'

export interface MovementChartProps {
  data: AnalyticsTimeBucket[]
  title?: string
  subtitle?: string
  height?: number
  inLabel?: string
  outLabel?: string
  emptyMessage?: string
  className?: string
}

export interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
  ariaLabel?: string
}
