'use client'

import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { signOutAction } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  locale: string
}

export function LogoutButton({ locale }: LogoutButtonProps) {
  const t = useTranslations('auth.logout')
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction(locale)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
      className="h-9 gap-1.5 border-border bg-background/80 text-xs font-medium shadow-2xs hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
      aria-label={t('button')}
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{isPending ? t('signingOut') : t('button')}</span>
    </Button>
  )
}
