import { ArrowLeftRight, History } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { MovementTable } from '@/features/movements/movement-table'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getStockMovements } from '@/services/stock-movement-service'

import type { ProductOption } from '@/features/movements/stock-mutation-dialog'
import type { Metadata } from 'next'

export const instant = false

interface MovementsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MovementsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('movements.title')} | Inventra`,
    description: t('movements.subtitle')
  }
}

export default async function MovementsPage({ params }: MovementsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary auth and authoritative user profile
  const { profile } = await requireAuth(locale)
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  // Query movements ledger and product options from Supabase
  const supabase = await createClient()

  const [movementsResult, { data: rawProducts }] = await Promise.all([
    getStockMovements(supabase, { pageSize: 15 }),
    supabase.from('products').select('id, sku, name, stock, unit').order('name', { ascending: true })
  ])

  const productOptions: ProductOption[] = (rawProducts || []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    unit: p.unit
  }))

  return (
    <div className="space-y-6">
      {/* Movements Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-2xs">
              <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{t('movements.title')}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('movements.subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-2xs sm:self-auto">
          <History className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{movementsResult.total} Transaksi Tercatat</span>
        </div>
      </div>

      {/* Movement Table and Interactive Filter Features */}
      <MovementTable initialMovements={movementsResult.movements} products={productOptions} userRole={profile.role} locale={locale} />
    </div>
  )
}
