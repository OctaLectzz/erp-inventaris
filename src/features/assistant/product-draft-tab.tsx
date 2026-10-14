'use client'

import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { generateProductDraftAction } from '@/app/actions/ai-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ProductDraftReviewCard } from './product-draft-review-card'

import type { AiProductDraft } from '@/types/ai'

interface ProductDraftTabProps {
  locale: string
  canSaveToCatalog: boolean
  isAuditor: boolean
  categories: string[]
}

const STARTER_PROMPTS = [
  'Minyak Atsiri Nilam Murni 50ml Botol Amber Dropper',
  'Jerigen Plastik HDPE 5 Liter Tutup Segel Food Grade',
  'Karton Corrugated Box 30x20x15cm Double Wall K125'
]

export function ProductDraftTab({ locale, canSaveToCatalog, isAuditor, categories }: ProductDraftTabProps) {
  const t = useTranslations('assistant.draftTab')

  const [prompt, setPrompt] = useState('')
  const [categoryHint, setCategoryHint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [generatedDraft, setGeneratedDraft] = useState<AiProductDraft | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await generateProductDraftAction(
      {
        prompt: prompt.trim(),
        categoryHint: categoryHint.trim() || undefined,
        locale: locale as 'id' | 'en'
      },
      locale
    )

    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message)
    } else {
      setGeneratedDraft(res.data)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">{t('inputLabel')}</CardTitle>
          <CardDescription className="text-xs">
            Ketik nama barang atau catatan mentah untuk menyusun draf data katalog secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="draft-prompt" className="text-xs font-semibold">
                {t('inputLabel')}
              </Label>
              <Input
                id="draft-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('inputPlaceholder')}
                disabled={isLoading || isAuditor}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="draft-category-hint" className="text-xs font-semibold">
                {t('categoryHintLabel')}
              </Label>
              <Input
                id="draft-category-hint"
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
                placeholder={t('categoryHintPlaceholder')}
                disabled={isLoading || isAuditor}
                className="text-xs"
                list="existing-categories"
              />
              <datalist id="existing-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-muted-foreground text-[11px] font-medium">{t('quickStarters')}</span>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(p)}
                    disabled={isLoading || isAuditor}
                    className="bg-muted hover:bg-muted/80 text-foreground border-border rounded-full border px-2.5 py-1 text-[11px] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isAuditor && <p className="text-xs text-amber-600 dark:text-amber-400">{t('auditorNotice')}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading || !prompt.trim() || isAuditor} className="gap-1.5 text-xs font-semibold">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>{t('generatingButton')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('generateButton')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {generatedDraft && <ProductDraftReviewCard draft={generatedDraft} locale={locale} canSaveToCatalog={canSaveToCatalog} isAuditor={isAuditor} />}
    </div>
  )
}
