import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface KpiStatCardProps {
  title: string
  value: string | number
  tooltip?: string
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  variant?: 'default' | 'accent' | 'destructive' | 'secondary'
  className?: string
}

export function KpiStatCard({ title, value, tooltip, description, icon: Icon, variant = 'default', className }: KpiStatCardProps) {
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

  const valueDisplay = (
    <div className={cn('text-xl font-bold tracking-tight break-words tabular-nums sm:text-2xl sm:break-normal xl:text-3xl', valueVariants[variant])}>
      {value}
    </div>
  )

  return (
    <Card className={cn('border-border shadow-2xs transition-shadow hover:shadow-xs', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground line-clamp-2 flex min-h-[2rem] items-center pr-2 text-xs leading-snug font-semibold tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconVariants[variant])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {tooltip ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="border-muted-foreground/40 inline-block cursor-help border-b border-dashed pb-0.5">{valueDisplay}</div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-semibold">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          valueDisplay
        )}
        <p className="text-muted-foreground text-xs leading-normal">{description}</p>
      </CardContent>
    </Card>
  )
}
