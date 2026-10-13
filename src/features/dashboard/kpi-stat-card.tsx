import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiStatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  variant?: 'default' | 'accent' | 'destructive' | 'secondary'
  className?: string
}

export function KpiStatCard({ title, value, description, icon: Icon, variant = 'default', className }: KpiStatCardProps) {
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

  return (
    <Card className={cn('border-border shadow-2xs transition-shadow hover:shadow-xs', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</CardTitle>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconVariants[variant])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className={cn('text-2xl font-bold tracking-tight sm:text-3xl', valueVariants[variant])}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
