import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

import type { VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-destructive/30 bg-destructive/15 text-destructive dark:border-destructive/40',
        outline: 'text-foreground border-border',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        accent: 'border-accent/30 bg-accent/15 text-accent-foreground dark:text-accent'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
