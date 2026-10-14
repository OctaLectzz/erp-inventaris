import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft, Boxes } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

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
  await connection()
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
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-primary text-lg font-bold tracking-tight">{tCommon('brand.name')}</span>
              <span className="text-muted-foreground hidden text-xs sm:ml-2 sm:inline-block">• {tCommon('brand.subtitle')}</span>
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
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tAuth('login.backToHome')}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border text-muted-foreground border-t py-6 text-center text-xs">
        <p>Inventra &copy; 2026 PT. Syailendra Bumi Investama. All rights reserved.</p>
      </footer>
    </div>
  )
}
