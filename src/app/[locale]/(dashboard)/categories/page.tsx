import { FolderTree, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

import { CategoryTable } from '@/features/categories/category-table'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getCategories } from '@/services/category-service'

import type { Metadata } from 'next'

export const instant = false

interface CategoriesPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  return {
    title: `${t('categories.title')} | Inventra`,
    description: t('categories.subtitle')
  }
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce server boundary auth and authoritative user profile
  const { profile } = await requireAuth(locale)
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  // Query master categories from Supabase
  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="space-y-6">
      {/* Categories Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-2xs">
              <FolderTree className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{t('categories.title')}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('categories.subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground shadow-2xs sm:self-auto dark:text-accent">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{t('categories.registeredCount', { count: categories.length })}</span>
        </div>
      </div>

      {/* Main Categories TanStack Table */}
      <CategoryTable initialCategories={categories} userRole={profile.role} locale={locale} />
    </div>
  )
}
