import Link from 'next/link'
import { connection } from 'next/server'
import { LayoutDashboard, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireAuth } from '@/services/auth-service'

import type { Metadata } from 'next'

export const instant = false

interface AssistantPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AssistantPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.assistant')} | Inventra`,
    description: 'Asisten cerdas berbasis AI untuk analisis inventaris dan operasional'
  }
}

export default async function AssistantPage({ params }: AssistantPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  await requireAuth(locale)
  const tSidebar = await getTranslations({ locale, namespace: 'sidebar' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tSidebar('items.assistant')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Asisten AI cerdas untuk wawasan stok dan bantuan draf produk</p>
          </div>
        </div>

        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent self-start text-xs sm:self-auto">
          Batch 4 Feature Roadmap
        </Badge>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold">Modul AI Assistant (Direncanakan Batch 4)</CardTitle>
          <CardDescription className="text-xs">
            Integrasi AI dengan guardrails server-side, stock insights natural language, dan generator gambar produk dijadwalkan untuk Batch 4.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Seluruh data katalog dan operasional saat ini dikelola secara presisi melalui antarmuka manual yang terproteksi integritas
            transaksionalnya.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={`/${locale}/dashboard`}>
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kembali ke Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
