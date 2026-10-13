'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'

import { recordStockMovementAction } from '@/app/actions/stock-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { MovementType, StockMutationSuccessData } from '@/types/inventory'

export interface ProductOption {
  id: string
  sku: string
  name: string
  stock: number
  unit?: string
}

interface StockMutationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductOption[]
  preselectedProductId?: string
  locale: string
  onSuccess?: (result: StockMutationSuccessData) => void
}

interface FormValues {
  productId: string
  type: MovementType
  quantity: number
  note: string
}

export function StockMutationDialog({ open, onOpenChange, products = [], preselectedProductId, locale, onSuccess }: StockMutationDialogProps) {
  const t = useTranslations('dashboard')
  const tValidation = useTranslations('validation')

  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      productId: preselectedProductId || (products[0]?.id ?? ''),
      type: 'IN',
      quantity: 1,
      note: ''
    }
  })

  const selectedProductId = useWatch({ control, name: 'productId' })
  const selectedType = useWatch({ control, name: 'type' })
  const quantityValue = useWatch({ control, name: 'quantity' })

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const currentStock = selectedProduct ? selectedProduct.stock : 0
  const parsedQty = Number.isInteger(Number(quantityValue)) && Number(quantityValue) > 0 ? Number(quantityValue) : 0

  const isOverdraft = selectedType === 'OUT' && parsedQty > currentStock
  const estimatedStockAfter = selectedType === 'IN' ? currentStock + parsedQty : Math.max(0, currentStock - parsedQty)

  // Sync default values when modal opens
  useEffect(() => {
    if (open) {
      reset({
        productId: preselectedProductId || (products[0]?.id ?? ''),
        type: 'IN',
        quantity: 1,
        note: ''
      })
    }
  }, [open, preselectedProductId, products, reset])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setServerError(null)
      setServerSuccess(null)
    }
    onOpenChange(newOpen)
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    setServerSuccess(null)

    const payload = {
      productId: values.productId,
      type: values.type,
      quantity: Number(values.quantity),
      note: values.note.trim()
    }

    const result = await recordStockMovementAction(payload, locale)

    if (!result.success) {
      setServerError(result.message)
      return
    }

    setServerSuccess(t('mutationDialog.success'))
    if (onSuccess) {
      onSuccess(result.data)
    }

    // Auto-close after brief confirmation
    setTimeout(() => {
      onOpenChange(false)
    }, 1200)
  }

  const getTranslatedError = (errorKey?: string): string => {
    if (!errorKey) return ''
    try {
      return tValidation(errorKey as Parameters<typeof tValidation>[0])
    } catch {
      return errorKey
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Package className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>{t('mutationDialog.title')}</DialogTitle>
              <DialogDescription className="text-xs">{t('mutationDialog.subtitle')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {serverError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="font-medium">{serverError}</p>
          </div>
        )}

        {serverSuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="font-medium">{serverSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="productId" className="text-xs font-semibold">
              {t('mutationDialog.productLabel')} <span className="text-destructive">*</span>
            </Label>
            <select
              id="productId"
              {...register('productId', { required: 'invalidProductId' })}
              disabled={isSubmitting}
              className="border-input bg-background text-foreground h-9 w-full rounded-md border px-3 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
              aria-invalid={Boolean(errors.productId)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Stok: {p.stock} {p.unit || 'pcs'})
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-destructive text-[11px]">{getTranslatedError(errors.productId.message)}</p>}
          </div>

          {/* Movement Type Radio Cards */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {t('mutationDialog.typeLabel')} <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Type IN Card */}
              <button
                type="button"
                onClick={() => setValue('type', 'IN')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all ${
                  selectedType === 'IN'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500 dark:text-emerald-400'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>{t('mutationDialog.typeInTitle')}</span>
                </div>
                <span className="text-[10px] leading-tight opacity-80">{t('mutationDialog.typeInDesc')}</span>
              </button>

              {/* Type OUT Card */}
              <button
                type="button"
                onClick={() => setValue('type', 'OUT')}
                className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all ${
                  selectedType === 'OUT'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 ring-1 ring-amber-500 dark:text-amber-400'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span>{t('mutationDialog.typeOutTitle')}</span>
                </div>
                <span className="text-[10px] leading-tight opacity-80">{t('mutationDialog.typeOutDesc')}</span>
              </button>
            </div>
          </div>

          {/* Quantity & Live Stock Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity" className="text-xs font-semibold">
                {t('mutationDialog.quantityLabel')} <span className="text-destructive">*</span>
              </Label>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span>{t('mutationDialog.currentStock')}:</span>
                <Badge variant="outline" className="font-mono text-[11px] font-bold">
                  {currentStock} {selectedProduct?.unit || 'pcs'}
                </Badge>
              </div>
            </div>

            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder={t('mutationDialog.quantityPlaceholder')}
              {...register('quantity', {
                valueAsNumber: true,
                required: 'quantityMustBePositive',
                min: { value: 1, message: 'quantityMustBePositive' }
              })}
              disabled={isSubmitting}
              className="font-mono text-sm"
              aria-invalid={Boolean(errors.quantity || isOverdraft)}
            />
            {errors.quantity && <p className="text-destructive text-[11px]">{getTranslatedError(errors.quantity.message)}</p>}

            {/* Overdraft Warning Banner */}
            {isOverdraft && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-1.5 rounded-md border p-2 text-[11px]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('mutationDialog.overdraftWarning')}</span>
              </div>
            )}

            {/* Stock Calculation Indicator */}
            {selectedProduct && parsedQty > 0 && !isOverdraft && (
              <div className="border-border bg-muted/40 flex items-center justify-between rounded-md border px-3 py-1.5 text-[11px]">
                <span className="text-muted-foreground">{t('mutationDialog.resultingStock')}:</span>
                <div className="flex items-center gap-1.5 font-mono font-semibold">
                  <span className="text-muted-foreground">{currentStock}</span>
                  <span className={selectedType === 'IN' ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedType === 'IN' ? `+${parsedQty}` : `-${parsedQty}`}
                  </span>
                  <span>=</span>
                  <span className="text-primary font-bold">{estimatedStockAfter} unit</span>
                </div>
              </div>
            )}
          </div>

          {/* Reason / Reference Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-xs font-semibold">
              {t('mutationDialog.noteLabel')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note"
              rows={2}
              placeholder={t('mutationDialog.notePlaceholder')}
              {...register('note', {
                required: 'noteMinLength',
                minLength: { value: 3, message: 'noteMinLength' },
                maxLength: { value: 500, message: 'noteMaxLength' }
              })}
              disabled={isSubmitting}
              className="text-xs"
              aria-invalid={Boolean(errors.note)}
            />
            {errors.note && <p className="text-destructive text-[11px]">{getTranslatedError(errors.note.message)}</p>}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t('mutationDialog.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || isOverdraft} className="min-w-28">
              {isSubmitting ? t('mutationDialog.submitting') : t('mutationDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
