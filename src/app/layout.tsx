import { Geist_Mono, Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

import type { Metadata, Viewport } from 'next'

import './globals.css'

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

export const metadata: Metadata = {
  title: {
    template: '%s | Inventra',
    default: 'Inventra — Mini ERP Inventory Management'
  },
  description: 'Warehouse inventory management, stock monitoring, and movement traceability system for PT. Syailendra Bumi Investama (DDistillers).',
  keywords: ['inventory', 'mini erp', 'warehouse management', 'stock in', 'stock out', 'ddistillers']
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F2D4A' },
    { media: '(prefers-color-scheme: dark)', color: '#091A2B' }
  ],
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={cn('h-full font-sans antialiased', inter.variable, geistMono.variable)}>
      <body className="bg-background text-foreground flex min-h-full flex-col">{children}</body>
    </html>
  )
}
