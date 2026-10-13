'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

const emptySubscribe = () => () => {}

export function ThemeToggle() {
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
      <Button variant="ghost" size="icon" disabled aria-hidden="true" className="h-9 w-9 touch-manipulation opacity-50">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 touch-manipulation"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('switchToLight') : t('switchToDark')}
      title={isDark ? t('light') : t('dark')}
    >
      {isDark ? <Sun className="text-accent h-4 w-4" aria-hidden="true" /> : <Moon className="text-primary h-4 w-4" aria-hidden="true" />}
    </Button>
  )
}
