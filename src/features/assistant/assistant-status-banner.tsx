'use client'

import { AlertCircle, CheckCircle2, Cpu } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'

import type { AiConfigStatus } from '@/types/ai'

interface AssistantStatusBannerProps {
  status: AiConfigStatus
}

export function AssistantStatusBanner({ status }: AssistantStatusBannerProps) {
  const t = useTranslations('assistant.banner')

  if (!status.isConfigured) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <span className="font-bold">{t('notConfigured')}: </span>
            <span>{t('notConfiguredNotice')}</span>
          </div>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300">
          Config Required
        </Badge>
      </div>
    )
  }

  return (
    <div className="border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <span className="font-semibold">{t('connected')}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Cpu className="h-3 w-3" aria-hidden="true" />
          <span>{status.modelName || '9Router Model'}</span>
        </span>
      </div>

      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-medium">
        9Router v1 Ready
      </Badge>
    </div>
  )
}
