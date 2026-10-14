import { Layers, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { CatalogTable } from '@/features/catalog/catalog-table'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getCatalogCategories, getInventoryCatalogData } from '@/services/product-service'

import type { Metadata } from 'next'

export const instant = false

interface InventoryPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: InventoryPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('catalog.title')} | Inventra`,
    description: t('catalog.subtitle')
  }
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary auth and authoritative user profile
  const { profile } = await requireAuth(locale)
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  // Query catalog data and categories from Supabase
  const supabase = await createClient()
  const [products, categories] = await Promise.all([getInventoryCatalogData(supabase), getCatalogCategories(supabase)])

  return (
    <div className="space-y-6">
      {/* Catalog Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg shadow-2xs">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{t('catalog.title')}</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{t('catalog.subtitle')}</p>
        </div>

        <div className="border-accent/30 bg-accent/10 text-accent-foreground dark:text-accent inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs sm:self-auto">
          <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('catalog.registeredCount', { count: products.length })}</span>
        </div>
      </div>

      {/* Catalog Table and Management Features */}
      <CatalogTable initialProducts={products} categories={categories} userRole={profile.role} locale={locale} />
    </div>
  )
}
