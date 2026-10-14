'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const t = useTranslations('common.theme')

  if (!mounted) {
    // Render a neutral placeholder with exact dimensions (36x36px) to avoid layout shift
    return (
      <Button variant="ghost" size="icon" disabled aria-hidden="true" className={cn('h-9 w-9 touch-manipulation opacity-50', className)}>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const tooltipText = isDark ? t('switchToLight') : t('switchToDark')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('border-border bg-background/80 hover:bg-secondary/60 h-9 w-9 touch-manipulation shadow-2xs transition-colors', className)}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={tooltipText}
          title={tooltipText}
        >
          {isDark ? <Sun className="text-accent h-4 w-4" aria-hidden="true" /> : <Moon className="text-primary h-4 w-4" aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span>{tooltipText}</span>
      </TooltipContent>
    </Tooltip>
  )
}
