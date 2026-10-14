'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from '@/app/actions/category-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { categoryInputSchema } from '@/schemas/inventory-schema'

import type { CategoryInput } from '@/schemas/inventory-schema'
import type { Category } from '@/types/inventory'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  mode?: 'create' | 'edit' | 'delete'
  locale: string
  onSuccess?: (category?: Category) => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CategoryFormDialog({ open, onOpenChange, category, mode = 'create', locale, onSuccess }: CategoryFormDialogProps) {
  const t = useTranslations('dashboard')
  const tValidation = useTranslations('validation')

  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

  const isDeleteMode = mode === 'delete'
  const isEditMode = mode === 'edit'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: ''
    }
  })

  const watchedName = watch('name')

  // Auto-generate slug while typing name in create mode if user hasn't edited slug manually
  useEffect(() => {
    if (!isEditMode && !isDeleteMode && !isSlugManuallyEdited && watchedName) {
      setValue('slug', slugify(watchedName), { shouldValidate: false })
    }
  }, [watchedName, isEditMode, isDeleteMode, isSlugManuallyEdited, setValue])

  useEffect(() => {
    if (open) {
      setServerError(null)
      setServerSuccess(null)
      setIsSlugManuallyEdited(false)
      if (category && (isEditMode || isDeleteMode)) {
        reset({
          name: category.name,
          slug: category.slug,
          description: category.description || ''
        })
      } else {
        reset({
          name: '',
          slug: '',
          description: ''
        })
      }
    }
  }, [open, category, isEditMode, isDeleteMode, reset])

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setServerError(null)
      setServerSuccess(null)
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: CategoryInput) => {
    setServerError(null)
    setServerSuccess(null)

    try {
      if (isEditMode && category) {
        const res = await updateCategoryAction(
          {
            id: category.id,
            name: values.name,
            slug: values.slug,
            description: values.description || null
          },
          locale
        )

        if (!res.success) {
          if (res.fieldErrors) {
            for (const [field, msg] of Object.entries(res.fieldErrors)) {
              setError(field as keyof CategoryInput, { message: msg })
            }
          }
          setServerError(res.message)
          return
        }

        setServerSuccess(t('categories.dialog.successUpdated'))
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.(res.data)
        }, 500)
      } else {
        const res = await createCategoryAction(values, locale)

        if (!res.success) {
          if (res.fieldErrors) {
            for (const [field, msg] of Object.entries(res.fieldErrors)) {
              setError(field as keyof CategoryInput, { message: msg })
            }
          }
          setServerError(res.message)
          return
        }

        setServerSuccess(t('categories.dialog.successCreated'))
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.(res.data)
        }, 500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
      setServerError(msg)
    }
  }

  const handleDelete = async () => {
    if (!category) return
    setIsDeleting(true)
    setServerError(null)

    try {
      const res = await deleteCategoryAction(category.id, locale)
      if (!res.success) {
        setServerError(res.message)
        setIsDeleting(false)
        return
      }

      setServerSuccess(t('categories.dialog.successDeleted'))
      setTimeout(() => {
        setIsDeleting(false)
        onOpenChange(false)
        onSuccess?.()
      }, 500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kategori'
      setServerError(msg)
      setIsDeleting(false)
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

  if (isDeleteMode) {
    return (
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              <span>{t('categories.dialog.deleteConfirmTitle')}</span>
            </DialogTitle>
            <DialogDescription>{t('categories.dialog.deleteConfirmDesc')}</DialogDescription>
          </DialogHeader>

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

          <div className="border-border bg-secondary/50 rounded-lg border p-3 text-xs">
            <span className="text-muted-foreground">{t('categories.columns.name')}: </span>
            <span className="text-foreground font-bold">{category?.name}</span>
            <span className="text-muted-foreground ml-2 font-mono">({category?.slug})</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isDeleting} className="text-xs">
              {t('categories.dialog.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || (category?.productCount ?? 0) > 0}
              className="gap-1.5 text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t('categories.dialog.deleting')}</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>{t('categories.dialog.deleteButton')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('categories.dialog.editTitle') : t('categories.dialog.createTitle')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('categories.dialog.editSubtitle') : t('categories.dialog.createSubtitle')}</DialogDescription>
        </DialogHeader>

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
          {/* Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-xs font-semibold">
              {t('categories.dialog.nameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder={t('categories.dialog.namePlaceholder')}
              {...register('name')}
              className="text-xs"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="text-destructive text-[11px]">{getTranslatedError(errors.name.message)}</p>}
          </div>

          {/* Slug Field */}
          <div className="space-y-1.5">
            <Label htmlFor="category-slug" className="text-xs font-semibold">
              {t('categories.dialog.slugLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-slug"
              placeholder={t('categories.dialog.slugPlaceholder')}
              {...register('slug', {
                onChange: () => setIsSlugManuallyEdited(true)
              })}
              className="font-mono text-xs lowercase"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug && <p className="text-destructive text-[11px]">{getTranslatedError(errors.slug.message)}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="category-description" className="text-xs font-semibold">
              {t('categories.dialog.descriptionLabel')}
            </Label>
            <Textarea
              id="category-description"
              rows={3}
              placeholder={t('categories.dialog.descriptionPlaceholder')}
              {...register('description')}
              className="text-xs"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="text-destructive text-[11px]">{getTranslatedError(errors.description.message)}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="text-xs">
              {t('categories.dialog.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5 text-xs font-semibold">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t('categories.dialog.saving')}</span>
                </>
              ) : (
                <span>{isEditMode ? t('categories.dialog.save') : t('categories.dialog.create')}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
