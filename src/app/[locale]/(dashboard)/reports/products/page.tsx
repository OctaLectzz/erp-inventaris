import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { ArrowLeft, LineChart, Package } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { ProductReportTable } from '@/features/reports/product-report-table'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getCatalogCategories, getInventoryCatalogData } from '@/services/product-service'
import { canViewReports } from '@/types/auth'

import type { Metadata } from 'next'

export const instant = false

interface ProductAnalysisPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ProductAnalysisPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('reports.productsTitle')} | Inventra`,
    description: t('reports.productsSubtitle')
  }
}

export default async function ProductAnalysisPage({ params }: ProductAnalysisPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)
  if (!canViewReports(profile.role)) {
    redirect(`/${locale}/dashboard`)
  }
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' })

  const supabase = await createClient()
  const [products, categories] = await Promise.all([getInventoryCatalogData(supabase), getCatalogCategories(supabase)])

  return (
    <div className="space-y-6">
      {/* Header and Back Action */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <LineChart className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/reports`}>
                <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground h-6 gap-1 px-1.5 text-xs">
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  <span>{tDashboard('reports.backToReports')}</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{tDashboard('reports.productsTitle')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{tDashboard('reports.productsSubtitle')}</p>
          </div>
        </div>

        <div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs sm:self-auto">
          <Package className="text-primary h-3.5 w-3.5" aria-hidden="true" />
          <span>{products.length} SKU Terdaftar</span>
        </div>
      </div>

      {/* Interactive Products Table */}
      <ProductReportTable products={products} categories={categories} locale={locale} />
    </div>
  )
}
