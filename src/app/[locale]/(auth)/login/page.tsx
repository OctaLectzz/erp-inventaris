import { ArrowLeft, Boxes } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LoginForm } from '@/features/auth/login-form'
import { getCurrentUserProfile, getSafeRedirectUrl } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface LoginPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ returnUrl?: string }>
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })

  return {
    title: `${t('title')} | Inventra`,
    description: t('subtitle')
  }
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params
  const { returnUrl } = await searchParams
  setRequestLocale(locale)

  // Server-side boundary check: If user is already authenticated with valid profile, redirect immediately
  const authState = await getCurrentUserProfile()
  if (authState) {
    const destination = getSafeRedirectUrl(returnUrl, `/${locale}/dashboard`)
    redirect(destination)
  }

  const tAuth = await getTranslations({ locale, namespace: 'auth' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-primary">{tCommon('brand.name')}</span>
              <span className="hidden text-xs text-muted-foreground sm:ml-2 sm:inline-block">• {tCommon('brand.subtitle')}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-4">
          <LoginForm locale={locale} returnUrl={returnUrl} />

          <div className="text-center">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tAuth('login.backToHome')}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Inventra &copy; 2026 PT. Syailendra Bumi Investama. All rights reserved.</p>
      </footer>
    </div>
  )
}
