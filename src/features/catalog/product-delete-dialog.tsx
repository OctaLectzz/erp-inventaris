'use client'

import { AlertCircle, AlertTriangle, Loader2, Package, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteProductAction } from '@/app/actions/product-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { Product } from '@/types/inventory'

interface ProductDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  locale: string
  onSuccess: (productId: string) => void
}

export function ProductDeleteDialog({ open, onOpenChange, product, locale, onSuccess }: ProductDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const t = useTranslations('dashboard')

  if (!product) return null

  const handleDelete = () => {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await deleteProductAction(product.id, locale)
      if (!res.success) {
        setErrorMessage(res.message)
        toast.error(res.message)
        return
      }

      toast.success(locale === 'en' ? `Product "${product.name}" successfully deleted.` : `Produk "${product.name}" berhasil dihapus dari katalog.`)
      onSuccess(product.id)
      onOpenChange(false)
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-base font-bold">
            {locale === 'en' ? 'Delete Product from Catalog' : 'Hapus Produk dari Katalog'}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {locale === 'en'
              ? 'Are you sure you want to permanently delete this product from the inventory master catalog?'
              : 'Apakah Anda yakin ingin menghapus produk ini dari katalog master inventaris?'}
          </DialogDescription>
        </DialogHeader>

        <div className="border-border bg-secondary/40 space-y-1.5 rounded-lg border p-3 text-xs">
          <div className="flex items-center gap-2">
            <Package className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-semibold">{product.name}</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
            <span>SKU: {product.sku}</span>
            <span>
              {locale === 'en' ? 'Category' : 'Kategori'}: {product.category}
            </span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between text-[11px]">
            <span>
              {locale === 'en' ? 'Unit' : 'Satuan'}: {product.unit}
            </span>
            <span className={product.stock > 0 ? 'font-bold text-amber-600 dark:text-amber-400' : 'font-medium'}>
              {locale === 'en' ? 'Current stock' : 'Stok saat ini'}: {product.stock} {product.unit}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <DialogFooter className="pt-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onOpenChange(false)}>
            {t('common.cancel') || (locale === 'en' ? 'Cancel' : 'Batal')}
          </Button>
          <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleDelete} className="gap-2">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{locale === 'en' ? 'Yes, Delete Product' : 'Ya, Hapus Produk'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
