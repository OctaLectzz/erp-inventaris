'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { createProductAction, updateProductAction } from '@/app/actions/product-actions'
import { ImageDropzone } from '@/components/shared/image-dropzone'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { productCatalogInputSchema } from '@/schemas/inventory-schema'

import type { ProductCatalogInput } from '@/schemas/inventory-schema'
import type { Product } from '@/types/inventory'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categories?: string[]
  locale: string
  onSuccess?: (product: Product) => void
}

export function ProductFormDialog({ open, onOpenChange, product, categories = [], locale, onSuccess }: ProductFormDialogProps) {
  const t = useTranslations('dashboard')
  const tValidation = useTranslations('validation')
  const isEditing = Boolean(product)

  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProductCatalogInput>({
    resolver: zodResolver(productCatalogInputSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: '',
      unit: 'pcs',
      price: 0,
      description: '',
      imageUrl: ''
    }
  })

  const currentImageUrl = watch('imageUrl')
  const currentSku = watch('sku')

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setServerError(null)
      setServerSuccess(null)
    }
    onOpenChange(nextOpen)
  }

  // Synchronize form values whenever the target product changes or dialog opens
  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          sku: product.sku,
          name: product.name,
          category: product.category,
          unit: product.unit,
          price: product.price,
          description: product.description || '',
          imageUrl: product.imageUrl || ''
        })
      } else {
        reset({
          sku: '',
          name: '',
          category: categories[0] || 'general',
          unit: 'pcs',
          price: 0,
          description: '',
          imageUrl: ''
        })
      }
    }
  }, [open, product, reset, categories])

  const onSubmit = async (values: ProductCatalogInput) => {
    setServerError(null)
    setServerSuccess(null)

    const payload: ProductCatalogInput = {
      sku: values.sku.trim().toUpperCase(),
      name: values.name.trim(),
      category: values.category.trim(),
      unit: values.unit.trim() || 'pcs',
      price: Number(values.price),
      description: values.description?.trim() || null,
      imageUrl: values.imageUrl?.trim() || null
    }

    try {
      if (isEditing && product) {
        const res = await updateProductAction({ ...payload, id: product.id }, locale)
        if (!res.success) {
          if (res.fieldErrors) {
            for (const [field, msgKey] of Object.entries(res.fieldErrors)) {
              setError(field as keyof ProductCatalogInput, {
                message: tValidation(msgKey as Parameters<typeof tValidation>[0])
              })
            }
          }
          setServerError(res.message)
          return
        }

        setServerSuccess(t('dialog.successUpdated'))
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.(res.data)
        }, 600)
      } else {
        const res = await createProductAction(payload, locale)
        if (!res.success) {
          if (res.fieldErrors) {
            for (const [field, msgKey] of Object.entries(res.fieldErrors)) {
              setError(field as keyof ProductCatalogInput, {
                message: tValidation(msgKey as Parameters<typeof tValidation>[0])
              })
            }
          }
          setServerError(res.message)
          return
        }

        setServerSuccess(t('dialog.successCreated'))
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.(res.data)
        }, 600)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setServerError(msg)
    }
  }

  const getTranslatedError = (errorKey?: string): string | undefined => {
    if (!errorKey) return undefined
    try {
      return tValidation(errorKey as Parameters<typeof tValidation>[0])
    } catch {
      return errorKey
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
          <DialogDescription>{isEditing ? t('dialog.editSubtitle') : t('dialog.createSubtitle')}</DialogDescription>
        </DialogHeader>

        {/* Stock Immutability Banner */}
        <div className="border-accent/40 bg-accent/10 text-accent-foreground dark:text-accent flex items-start gap-2.5 rounded-lg border p-3 text-xs leading-relaxed">
          <Info className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{isEditing ? t('dialog.stockNoticeEdit') : t('dialog.stockNoticeCreate')}</p>
        </div>

        {/* Server Feedback Alerts */}
        {serverError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* SKU Field */}
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs font-semibold">
                {t('dialog.fields.sku')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                placeholder={t('dialog.fields.skuPlaceholder')}
                {...register('sku')}
                className="font-mono text-xs uppercase"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.sku)}
              />
              {errors.sku && <p className="text-destructive text-[11px]">{getTranslatedError(errors.sku.message)}</p>}
            </div>

            {/* Satuan Unit */}
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs font-semibold">
                {t('dialog.fields.unit')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                placeholder={t('dialog.fields.unitPlaceholder')}
                {...register('unit')}
                className="text-xs"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.unit)}
              />
              {errors.unit && <p className="text-destructive text-[11px]">{getTranslatedError(errors.unit.message)}</p>}
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              {t('dialog.fields.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={t('dialog.fields.namePlaceholder')}
              {...register('name')}
              className="text-xs"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="text-destructive text-[11px]">{getTranslatedError(errors.name.message)}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">
                {t('dialog.fields.category')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                list="category-suggestions"
                placeholder={t('dialog.fields.categoryPlaceholder')}
                {...register('category')}
                className="text-xs"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.category)}
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.category && <p className="text-destructive text-[11px]">{getTranslatedError(errors.category.message)}</p>}
            </div>

            {/* Reference Price (IDR) */}
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold">
                {t('dialog.fields.price')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                placeholder={t('dialog.fields.pricePlaceholder')}
                {...register('price', { valueAsNumber: true })}
                className="text-xs"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.price)}
              />
              {errors.price && <p className="text-destructive text-[11px]">{getTranslatedError(errors.price.message)}</p>}
            </div>
          </div>

          {/* Product Image Dropzone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t('dialog.fields.imageUrl')}</Label>
            <ImageDropzone
              value={currentImageUrl}
              onChange={(url) => setValue('imageUrl', url || '', { shouldValidate: true })}
              disabled={isSubmitting}
              skuHint={currentSku}
            />
            {errors.imageUrl && <p className="text-destructive text-[11px]">{getTranslatedError(errors.imageUrl.message)}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              {t('dialog.fields.description')}
            </Label>
            <Textarea
              id="description"
              rows={2}
              placeholder={t('dialog.fields.descriptionPlaceholder')}
              {...register('description')}
              className="text-xs"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t('dialog.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-24">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>{t('dialog.saving')}</span>
                </>
              ) : isEditing ? (
                t('dialog.save')
              ) : (
                t('dialog.create')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
