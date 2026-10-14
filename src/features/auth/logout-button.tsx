'use client'

import { useState, useTransition } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { signOutAction } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  locale: string
  variant?: 'default' | 'icon'
  className?: string
}

export function LogoutButton({ locale, variant = 'default', className }: LogoutButtonProps) {
  const t = useTranslations('auth.logout')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleConfirmLogout = () => {
    startTransition(async () => {
      await signOutAction(locale)
    })
  }

  const triggerButton = (
    <Button
      variant="outline"
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={() => setOpen(true)}
      disabled={isPending}
      className={cn(
        'border-border bg-background/80 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-9 font-medium shadow-2xs transition-colors',
        variant === 'icon' ? 'w-9' : 'gap-1.5 text-xs',
        className
      )}
      aria-label={t('button')}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {variant !== 'icon' && <span>{isPending ? t('signingOut') : t('button')}</span>}
    </Button>
  )

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip>
          <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
          <TooltipContent side="top">
            <span>{t('button')}</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl sm:mx-0">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-left text-lg font-bold">{t('confirmTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-left text-xs">{t('confirmDesc')}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setOpen(false)} className="text-xs font-semibold">
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleConfirmLogout}
              className="gap-1.5 text-xs font-semibold"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>{isPending ? t('signingOut') : t('confirm')}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
