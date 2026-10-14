'use client'

import { Suspense, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface LocaleSwitcherProps {
  variant?: 'default' | 'icon'
  className?: string
}

function LocaleSwitcherInner({ variant = 'default', className }: LocaleSwitcherProps) {
  const t = useTranslations('navigation.language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const nextLocale = locale === 'id' ? 'en' : 'id'

  const handleSwitch = () => {
    startTransition(() => {
      const queryString = searchParams ? searchParams.toString() : ''
      const targetPath = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(targetPath, { locale: nextLocale })
    })
  }

  const tooltipText = nextLocale === 'en' ? t('switchToEn') : t('switchToId')

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwitch}
            disabled={isPending}
            aria-label={tooltipText}
            title={tooltipText}
            className={cn('border-border bg-background/80 hover:bg-secondary/60 h-9 w-9 shadow-2xs transition-colors', className)}
          >
            <Globe className="text-accent h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{tooltipText}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{tooltipText}</span>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={tooltipText}
      title={tooltipText}
      className={cn('border-border bg-background/80 hover:bg-secondary/60 h-9 gap-1.5 text-xs font-medium shadow-2xs', className)}
    >
      <Globe className="text-accent h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-semibold tracking-wider uppercase">{locale}</span>
      <span className="text-muted-foreground hidden sm:inline">• {locale === 'id' ? t('id') : t('en')}</span>
    </Button>
  )
}

function LocaleSwitcherFallback({ variant = 'default', className }: LocaleSwitcherProps) {
  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        aria-hidden="true"
        className={cn('border-border bg-background/80 h-9 w-9 opacity-60 shadow-2xs', className)}
      >
        <Globe className="text-accent h-4 w-4" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      aria-hidden="true"
      className={cn('border-border bg-background/80 h-9 gap-1.5 text-xs font-medium opacity-60 shadow-2xs', className)}
    >
      <Globe className="text-accent h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-semibold tracking-wider uppercase">ID</span>
    </Button>
  )
}

export function LocaleSwitcher({ variant = 'default', className }: LocaleSwitcherProps) {
  return (
    <Suspense fallback={<LocaleSwitcherFallback variant={variant} className={className} />}>
      <LocaleSwitcherInner variant={variant} className={className} />
    </Suspense>
  )
}
