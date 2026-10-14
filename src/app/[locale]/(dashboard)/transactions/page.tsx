import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { TransactionCartView } from '@/features/transactions/transaction-cart-view'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'

import type { ProductCatalogItem } from '@/features/transactions/transaction-cart-view'
import type { Metadata } from 'next'

export const instant = false

interface TransactionsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TransactionsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard.transactions' })

  return {
    title: `${t('title')} | Inventra`,
    description: t('subtitle')
  }
}

export default async function TransactionsPage({ params }: TransactionsPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary auth and authoritative user profile
  const { profile } = await requireAuth(locale)

  // Query product catalog for transaction selection
  const supabase = await createClient()
  const { data: rawProducts } = await supabase.from('products').select('id, sku, name, stock, unit, price').order('name', { ascending: true })

  const productCatalog: ProductCatalogItem[] = (rawProducts || []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    unit: p.unit || 'unit',
    price: Number(p.price) || 0
  }))

  return <TransactionCartView products={productCatalog} profile={profile} locale={locale} />
}
