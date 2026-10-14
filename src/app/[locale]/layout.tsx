import { Geist_Mono, Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

import type { Metadata, Viewport } from 'next'

import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isEn = locale === 'en'

  return {
    title: {
      template: '%s | Inventra',
      default: isEn ? 'Inventra — Mini ERP Inventory Management' : 'Inventra — Sistem Manajemen Inventaris Terpadu'
    },
    description: isEn
      ? 'Warehouse inventory management, stock monitoring, and movement traceability system for PT. Syailendra Bumi Investama (DDistillers).'
      : 'Sistem manajemen inventaris gudang, pemantauan stok real-time, dan audit pergerakan barang untuk PT. Syailendra Bumi Investama (DDistillers).',
    keywords: ['inventory', 'mini erp', 'warehouse management', 'stock in', 'stock out', 'ddistillers']
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F2D4A' },
    { media: '(prefers-color-scheme: dark)', color: '#091A2B' }
  ],
  width: 'device-width',
  initialScale: 1
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Fetch all messages for the current locale
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className={cn('h-full font-sans antialiased', inter.variable, geistMono.variable)}>
      <body suppressHydrationWarning className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
