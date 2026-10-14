import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface KpiStatCardProps {
  title: string
  value: string | number
  tooltip?: string
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }> | React.ReactNode
  variant?: 'default' | 'accent' | 'destructive' | 'secondary'
  miniChart?: React.ReactNode
  className?: string
}

export function KpiStatCard({ title, value, tooltip, description, icon, variant = 'default', miniChart, className }: KpiStatCardProps) {
  const iconVariants = {
    default: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-accent-foreground dark:text-accent',
    destructive: 'bg-destructive/10 text-destructive',
    secondary: 'bg-secondary text-primary'
  }

  const valueVariants = {
    default: 'text-foreground',
    accent: 'text-foreground',
    destructive: 'text-destructive',
    secondary: 'text-primary'
  }

  const borderLeftVariants = {
    default: 'border-l-4 border-l-primary',
    accent: 'border-l-4 border-l-accent',
    destructive: 'border-l-4 border-l-destructive',
    secondary: 'border-l-4 border-l-primary/60 dark:border-l-primary/80'
  }

  const valueDisplay = (
    <div className={cn('text-xl font-bold tracking-tight break-words tabular-nums sm:text-2xl sm:break-normal xl:text-3xl', valueVariants[variant])}>
      {value}
    </div>
  )

  const renderedIcon = React.isValidElement(icon)
    ? icon
    : icon
      ? React.createElement(icon as React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>, {
          className: 'h-4 w-4',
          'aria-hidden': true
        })
      : null

  return (
    <Card className={cn('border-border shadow-2xs transition-shadow hover:shadow-xs', borderLeftVariants[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="line-clamp-2 flex min-h-[2rem] items-center pr-2 text-xs leading-snug font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </CardTitle>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconVariants[variant])}>{renderedIcon}</div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          {tooltip ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block cursor-help border-b border-dashed border-muted-foreground/40 pb-0.5">{valueDisplay}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-semibold">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            valueDisplay
          )}
          {miniChart && <div className="shrink-0">{miniChart}</div>}
        </div>
        <p className="text-xs leading-normal text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
