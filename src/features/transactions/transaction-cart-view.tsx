'use client'

import { useId, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { recordBatchStockMovementAction } from '@/app/actions/stock-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { canMutateStock } from '@/types/auth'

import type { UserProfile } from '@/types/auth'
import type { BatchStockMutationSuccessData, MovementType } from '@/types/inventory'

export interface ProductCatalogItem {
  id: string
  sku: string
  name: string
  stock: number
  unit?: string
  price?: number
}

export interface CartRowItem {
  productId: string
  sku: string
  name: string
  currentStock: number
  quantity: number
  unit: string
}

interface TransactionCartViewProps {
  products: ProductCatalogItem[]
  profile: UserProfile
  locale: string
}

export function TransactionCartView({ products = [], profile, locale }: TransactionCartViewProps) {
  const t = useTranslations('dashboard.transactions')
  const tCatalog = useTranslations('dashboard.catalog')
  const selectProductId = useId()
  const noteFieldId = useId()

  const hasMutationAccess = canMutateStock(profile.role)

  // Transaction configuration
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [cartItems, setCartItems] = useState<CartRowItem[]>([])
  const [note, setNote] = useState('')

  // Item addition form state
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? '')
  const [itemQuantity, setItemQuantity] = useState<number>(1)
  const [productSearch, setProductSearch] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Execution state
  const [isPending, startTransition] = useTransition()
  const [executionResult, setExecutionResult] = useState<BatchStockMutationSuccessData | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const query = productSearch.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))
  }, [products, productSearch])

  // Current selected product object
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  // Check overdraft for addition form
  const isCandidateOverdraft = movementType === 'OUT' && activeProduct !== null && itemQuantity > activeProduct.stock

  // Calculations for summary
  const totalUnits = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0)
  }, [cartItems])

  // Handle switching transaction type
  const handleTypeChange = (newType: MovementType) => {
    if (newType === movementType) return
    setMovementType(newType)
    setFormError(null)
    setExecutionError(null)
    // Re-verify if any item in cart exceeds current stock if switched to OUT
    if (newType === 'OUT') {
      const overdraftItem = cartItems.find((item) => item.quantity > item.currentStock)
      if (overdraftItem) {
        setFormError(`Item ${overdraftItem.sku} melebihi stok yang tersedia untuk mutasi keluar.`)
      }
    }
  }

  // Add item to cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setExecutionError(null)

    if (!activeProduct) {
      setFormError('Pilih produk dari katalog terlebih dahulu.')
      return
    }

    if (itemQuantity <= 0 || !Number.isInteger(itemQuantity)) {
      setFormError('Kuantitas harus berupa bilangan bulat positif (minimal 1).')
      return
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex((item) => item.productId === activeProduct.id)
    if (existingIndex >= 0) {
      setFormError(t('alreadyInCart'))
      return
    }

    // Validate overdraft for OUT
    if (movementType === 'OUT' && itemQuantity > activeProduct.stock) {
      setFormError(t('validationStockExceeded'))
      return
    }

    const newItem: CartRowItem = {
      productId: activeProduct.id,
      sku: activeProduct.sku,
      name: activeProduct.name,
      currentStock: activeProduct.stock,
      quantity: itemQuantity,
      unit: activeProduct.unit || 'unit'
    }

    setCartItems((prev) => [...prev, newItem])
    setItemQuantity(1)
  }

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
    setFormError(null)
  }

  // Clear entire cart
  const handleClearCart = () => {
    setCartItems([])
    setFormError(null)
    setExecutionError(null)
  }

  // Execute batch stock movement action
  const handleExecuteTransaction = () => {
    setExecutionError(null)

    if (!hasMutationAccess) {
      setExecutionError(t('readOnlyNotice'))
      return
    }

    if (cartItems.length === 0) {
      setExecutionError(t('validationAtLeastOne'))
      return
    }

    if (note.trim().length < 3) {
      setExecutionError(t('validationNoteMin'))
      return
    }

    // Pre-flight check: ensure no OUT item exceeds current stock
    if (movementType === 'OUT') {
      const overdraft = cartItems.find((item) => item.quantity > item.currentStock)
      if (overdraft) {
        setExecutionError(
          `Item ${overdraft.name} (SKU: ${overdraft.sku}) melebihi stok yang tersedia: diminta ${overdraft.quantity}, tersedia ${overdraft.currentStock}.`
        )
        return
      }
    }

    startTransition(async () => {
      const response = await recordBatchStockMovementAction(
        {
          type: movementType,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          note: note.trim()
        },
        locale
      )

      if (response.success) {
        setExecutionResult(response.data)
        setCartItems([])
        setNote('')
      } else {
        setExecutionError(response.message || t('errorTitle'))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg shadow-2xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>

        <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent self-start text-xs sm:self-auto">
          {t('badgeActive')}
        </Badge>
      </div>

      {/* Read-Only Notice for Auditor Role */}
      {!hasMutationAccess && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-800 shadow-2xs dark:text-amber-300"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">{t('readOnlyNotice')}</p>
            <p className="font-normal text-amber-700/80 dark:text-amber-400/80">
              Anda dapat mengamati alur perancangan transaksi mutasi keranjang, namun eksekusi perubahan stok ke basis data hanya diizinkan untuk
              Administrator Sistem dan Staf Gudang.
            </p>
          </div>
        </div>
      )}

      {/* Execution Success Banner */}
      {executionResult && (
        <Card className="border-accent/40 bg-accent/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-accent h-5 w-5" aria-hidden="true" />
              <CardTitle className="text-primary text-base font-bold">{t('successTitle')}</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-xs">{t('successMessage', { count: executionResult.items_count })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-background/80 grid grid-cols-1 gap-2 rounded-lg border p-3 text-xs sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('batchIdLabel')}</span>
                <span className="text-foreground font-mono font-bold">{executionResult.batch_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('totalUnits')}</span>
                <span className="text-primary font-bold">
                  {executionResult.movements.reduce((acc, m) => acc + m.quantity, 0)} Unit ({executionResult.type})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Catatan Referensi</span>
                <span className="text-foreground truncate font-medium">{executionResult.note}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href={`/${locale}/movements`}>
                <Button size="sm" className="gap-1.5 text-xs font-semibold">
                  <span>Lihat di Riwayat Mutasi</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setExecutionResult(null)} className="text-xs font-semibold">
                <span>Catat Transaksi Lainnya</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Error Banner */}
      {executionError && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border p-4 text-xs font-semibold shadow-2xs"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">{t('errorTitle')}</p>
            <p className="font-normal">{executionError}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Cart Right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Transaction Config & Item Picker (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 1: Transaction Type Toggle */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">{t('typeLabel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('typeLabel')}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={movementType === 'IN'}
                  onClick={() => handleTypeChange('IN')}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                    movementType === 'IN'
                      ? 'border-accent bg-accent/15 text-accent-foreground dark:text-accent ring-accent/30 shadow-2xs ring-2'
                      : 'border-border bg-card hover:bg-muted text-muted-foreground'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                      <ArrowDownRight className="text-accent h-4 w-4" aria-hidden="true" />
                      <span>Masuk (IN)</span>
                    </span>
                    {movementType === 'IN' && <CheckCircle2 className="text-accent h-3.5 w-3.5" aria-hidden="true" />}
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">Penerimaan barang fisik dari supplier/restock</p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={movementType === 'OUT'}
                  onClick={() => handleTypeChange('OUT')}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                    movementType === 'OUT'
                      ? 'border-primary bg-primary/10 text-primary ring-primary/30 shadow-2xs ring-2'
                      : 'border-border bg-card hover:bg-muted text-muted-foreground'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                      <ArrowUpRight className="text-primary h-4 w-4" aria-hidden="true" />
                      <span>Keluar (OUT)</span>
                    </span>
                    {movementType === 'OUT' && <CheckCircle2 className="text-primary h-3.5 w-3.5" aria-hidden="true" />}
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">Pengeluaran barang fisik untuk pesanan/distribusi</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Add Product to Cart Form */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">{t('selectProduct')}</CardTitle>
              <CardDescription className="text-xs">Pilih item katalog dan tentukan jumlah unit yang akan dimutasi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddToCart} className="space-y-4">
                {/* Product Search & Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={selectProductId} className="text-foreground text-xs font-semibold">
                      {tCatalog('columns.product')}
                    </Label>
                    {activeProduct && (
                      <span className="text-muted-foreground font-mono text-[11px]">
                        Stok Sekarang: <strong className="text-foreground">{activeProduct.stock}</strong> {activeProduct.unit || 'unit'}
                      </span>
                    )}
                  </div>

                  {/* Search filter for dropdown */}
                  <div className="relative mb-1.5">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                    <Input
                      type="text"
                      placeholder="Cari SKU atau nama..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <select
                    id={selectProductId}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="border-input bg-background text-foreground ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-2xs focus-visible:ring-2 focus-visible:outline-none"
                    disabled={products.length === 0}
                  >
                    {filteredProducts.length === 0 ? (
                      <option disabled value="">
                        Tidak ada produk yang cocok
                      </option>
                    ) : (
                      filteredProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} (Stok: {p.stock})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Quantity Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-qty-input" className="text-foreground text-xs font-semibold">
                    {t('colQuantity')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="item-qty-input"
                      type="number"
                      min={1}
                      max={movementType === 'OUT' && activeProduct ? activeProduct.stock : 999999}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-xs font-semibold"
                    />
                    <span className="text-muted-foreground min-w-12 text-xs font-medium">{activeProduct?.unit || 'unit'}</span>
                  </div>
                </div>

                {/* Overdraft Warning Notice */}
                {isCandidateOverdraft && (
                  <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('validationStockExceeded')}</span>
                  </div>
                )}

                {/* Resulting Stock Preview */}
                {activeProduct && !isCandidateOverdraft && (
                  <div className="bg-muted/40 border-border/80 flex items-center justify-between rounded-lg border p-2.5 text-xs">
                    <span className="text-muted-foreground">Estimasi Stok Akhir:</span>
                    <span className="text-foreground font-mono font-bold">
                      {movementType === 'IN' ? activeProduct.stock + itemQuantity : activeProduct.stock - itemQuantity} {activeProduct.unit || 'unit'}
                    </span>
                  </div>
                )}

                {/* Local Form Error */}
                {formError && (
                  <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Add to List Button */}
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!activeProduct || isCandidateOverdraft || products.length === 0}
                  className="w-full gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('addToList')}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cart Table & Atomicity Execution Panel (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold">{t('cartTitle')}</CardTitle>
                <CardDescription className="text-xs">{t('cartSubtitle')}</CardDescription>
              </div>

              {cartItems.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive h-8 gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  <span>{t('clearButton')}</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Cart Items Table */}
              {cartItems.length === 0 ? (
                <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                  <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-full">
                    <Boxes className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-foreground text-sm font-bold">{t('emptyCartTitle')}</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">{t('emptyCartDesc')}</p>
                </div>
              ) : (
                <div className="border-border overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-[11px] font-bold">{t('colSku')}</TableHead>
                        <TableHead className="text-[11px] font-bold">{t('colName')}</TableHead>
                        <TableHead className="text-right text-[11px] font-bold">{t('colCurrentStock')}</TableHead>
                        <TableHead className="text-right text-[11px] font-bold">{t('colQuantity')}</TableHead>
                        <TableHead className="text-right text-[11px] font-bold">{t('colNewStock')}</TableHead>
                        <TableHead className="text-center text-[11px] font-bold">{t('colActions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => {
                        const newStock = movementType === 'IN' ? item.currentStock + item.quantity : item.currentStock - item.quantity
                        const isOverdraft = movementType === 'OUT' && item.quantity > item.currentStock

                        return (
                          <TableRow key={item.productId} className="text-xs">
                            <TableCell className="font-mono text-[11px] font-semibold">{item.sku}</TableCell>
                            <TableCell className="max-w-[140px] truncate font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground text-right font-mono">{item.currentStock}</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              <span className={cn(movementType === 'IN' ? 'text-accent' : 'text-primary')}>
                                {movementType === 'IN' ? `+${item.quantity}` : `-${item.quantity}`}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {isOverdraft ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  Stok Kurang
                                </Badge>
                              ) : (
                                <span className="text-foreground font-bold">{newStock}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.productId)}
                                disabled={isPending}
                                className="text-muted-foreground hover:text-destructive h-7 w-7"
                                title="Hapus dari transaksi"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Transaction Note & Summary Controls */}
              {cartItems.length > 0 && (
                <div className="space-y-4 pt-2">
                  {/* Summary Metric Counters */}
                  <div className="bg-muted/40 border-border grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t('totalLines')}</span>
                      <span className="text-foreground font-bold">{cartItems.length} SKU</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">{t('totalUnits')}</span>
                      <span className="text-primary font-bold">
                        {totalUnits} Unit ({movementType})
                      </span>
                    </div>
                  </div>

                  {/* Transaction Note / Reference Document Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={noteFieldId} className="text-foreground text-xs font-semibold">
                        {t('noteLabel')} <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-muted-foreground font-mono text-[10px]">{note.trim().length} / min 3 kar</span>
                    </div>
                    <Textarea
                      id={noteFieldId}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('notePlaceholder')}
                      disabled={isPending || !hasMutationAccess}
                      rows={2}
                      className="text-xs"
                      required
                    />
                  </div>

                  {/* Execution Action Button */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleExecuteTransaction}
                      disabled={isPending || !hasMutationAccess || cartItems.length === 0 || note.trim().length < 3}
                      className="w-full gap-2 font-bold shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>{t('submitting')}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          <span>{t('submitButton')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
