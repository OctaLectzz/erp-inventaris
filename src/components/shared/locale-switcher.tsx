'use client'

import { Suspense, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from '@/i18n/navigation'

function LocaleSwitcherInner() {
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={nextLocale === 'en' ? t('switchToEn') : t('switchToId')}
      title={nextLocale === 'en' ? t('switchToEn') : t('switchToId')}
      className="border-border bg-background/80 hover:bg-secondary/60 h-9 gap-1.5 text-xs font-medium shadow-2xs"
    >
      <Globe className="text-accent h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-semibold tracking-wider uppercase">{locale}</span>
      <span className="text-muted-foreground hidden sm:inline">• {locale === 'id' ? t('id') : t('en')}</span>
    </Button>
  )
}

function LocaleSwitcherFallback() {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      aria-hidden="true"
      className="border-border bg-background/80 h-9 gap-1.5 text-xs font-medium opacity-60 shadow-2xs"
    >
      <Globe className="text-accent h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-semibold tracking-wider uppercase">ID</span>
    </Button>
  )
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={<LocaleSwitcherFallback />}>
      <LocaleSwitcherInner />
    </Suspense>
  )
}
