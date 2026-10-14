'use client'

import { AlertCircle, Check, Copy, Info, PlusCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { createProductAction } from '@/app/actions/product-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { AiProductDraft } from '@/types/ai'

interface ProductDraftReviewCardProps {
  draft: AiProductDraft
  locale: string
  canSaveToCatalog: boolean
  isAuditor: boolean
  onSavedSuccess?: () => void
}

export function ProductDraftReviewCard({ draft, locale, canSaveToCatalog, isAuditor, onSavedSuccess }: ProductDraftReviewCardProps) {
  const t = useTranslations('assistant.draftTab')

  const [form, setForm] = useState({
    sku: draft.sku,
    name: draft.name,
    category: draft.category,
    unit: draft.unit,
    price: draft.price,
    description: draft.description
  })

  const [copied, setCopied] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleCopy = () => {
    const text = `SKU: ${form.sku}\nNama: ${form.name}\nKategori: ${form.category}\nSatuan: ${form.unit}\nHarga: Rp ${form.price.toLocaleString('id-ID')}\nDeskripsi: ${form.description}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveConfirmed = async () => {
    setIsSaving(true)
    setSaveError(null)

    // Strictly enforce stock = 0 by delegating to createProductAction
    const res = await createProductAction(
      {
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit.trim(),
        price: Number(form.price) || 0,
        description: form.description.trim() || undefined
      },
      locale
    )

    setIsSaving(false)
    if (!res.success) {
      const err = res.message || 'Gagal menyimpan produk.'
      setSaveError(err)
      toast.error(err)
    } else {
      setSaveSuccess(true)
      setIsConfirmOpen(false)
      toast.success(locale === 'en' ? `Product draft "${form.name}" saved to catalog.` : `Draf produk "${form.name}" berhasil disimpan ke katalog.`)
      if (onSavedSuccess) onSavedSuccess()
    }
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">{t('reviewTitle')}</CardTitle>
            <CardDescription className="text-xs">{draft.notes || t('factsTitle')}</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">
            Draft (Stock = 0)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {draft.assumptions.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{t('assumptionsTitle')}: </span>
            <ul className="list-inside list-disc pt-1">
              {draft.assumptions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{t('skuLabel')}</Label>
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} className="font-mono text-xs" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{t('nameLabel')}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-xs font-medium" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{t('categoryLabel')}</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t('unitLabel')}</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('priceLabel')}</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Math.max(0, parseInt(e.target.value) || 0) })}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">{t('descLabel')}</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-xs" />
        </div>

        {draft.specifications.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold">{t('specsLabel')}</Label>
            <div className="bg-muted/40 divide-border divide-y rounded-lg border text-[11px]">
              {draft.specifications.map((spec, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <span className="text-muted-foreground">{spec.key}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{spec.value}</span>
                    {spec.isAssumption && (
                      <Badge variant="outline" className="py-0 text-[9px]">
                        Asumsi AI
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {saveError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-2.5 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('saveSuccess')}</span>
          </div>
        )}

        {!canSaveToCatalog && !isAuditor && (
          <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>{t('staffNotice')}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? t('copied') : t('copyDraft')}</span>
          </Button>

          {canSaveToCatalog && (
            <Button type="button" size="sm" disabled={saveSuccess} onClick={() => setIsConfirmOpen(true)} className="gap-1.5 text-xs font-semibold">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{t('saveToCatalog')}</span>
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{t('saveConfirmTitle')}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">{t('saveConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/40 space-y-1 rounded-lg p-3 text-xs">
            <p>
              <strong>SKU:</strong> {form.sku}
            </p>
            <p>
              <strong>Nama:</strong> {form.name}
            </p>
            <p>
              <strong>Kategori:</strong> {form.category}
            </p>
            <p>
              <strong>Stok Awal:</strong> <span className="text-primary font-bold">0 {form.unit}</span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)} disabled={isSaving}>
              {t('cancel')}
            </Button>
            <Button type="button" size="sm" onClick={handleSaveConfirmed} disabled={isSaving} className="font-semibold">
              {isSaving ? t('saving') : t('saveConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
