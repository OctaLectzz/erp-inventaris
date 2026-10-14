import { z } from 'zod'

/**
 * Validation schema for stock movement mutation input.
 * Strict rules:
 * - productId must be a valid UUID
 * - type must be either 'IN' or 'OUT'
 * - quantity must be a positive integer (> 0; no decimals, no negatives, no zero)
 * - note must be non-empty and between 3 and 500 characters
 */
export const stockMutationInputSchema = z.object({
  productId: z.string().uuid({ message: 'invalidProductId' }),
  type: z.enum(['IN', 'OUT'], { message: 'invalidMovementType' }),
  quantity: z.number().int({ message: 'quantityMustBeInteger' }).positive({ message: 'quantityMustBePositive' }),
  note: z.string().trim().min(3, { message: 'noteMinLength' }).max(500, { message: 'noteMaxLength' })
})

export type StockMutationInput = z.infer<typeof stockMutationInputSchema>

/**
 * Item in a multi-item batch stock mutation transaction.
 */
export const batchStockItemSchema = z.object({
  productId: z.string().uuid({ message: 'invalidProductId' }),
  sku: z.string().optional(),
  name: z.string().optional(),
  currentStock: z.number().int().nonnegative().optional(),
  quantity: z
    .number({ message: 'quantityMustBeNumber' })
    .int({ message: 'quantityMustBeInteger' })
    .positive({ message: 'quantityMustBePositive' })
    .max(2147483647, { message: 'quantityOverflow' })
})

export type BatchStockItem = z.infer<typeof batchStockItemSchema>

/**
 * Validation schema for multi-item atomic stock mutation transaction (Batch 2).
 * Enforces:
 * - Transaction type must be strictly 'IN' or 'OUT'
 * - Non-empty items list (1 to 100 items)
 * - Unique product IDs within the same transaction
 * - Reference note between 3 and 500 characters
 */
export const batchStockMutationSchema = z.object({
  type: z.enum(['IN', 'OUT'], { message: 'invalidMovementType' }),
  note: z.string().trim().min(3, { message: 'noteMinLength' }).max(500, { message: 'noteMaxLength' }),
  items: z
    .array(batchStockItemSchema)
    .min(1, { message: 'batchMustContainAtLeastOneItem' })
    .max(100, { message: 'batchItemLimitExceeded' })
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId)
        return new Set(ids).size === ids.length
      },
      { message: 'duplicateProductInBatch' }
    )
})

export type BatchStockMutationInput = z.infer<typeof batchStockMutationSchema>

/**
 * Validation schema for product catalog creation / updates.
 */
export const productInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, { message: 'skuTooShort' })
    .max(50, { message: 'skuTooLong' })
    .regex(/^[A-Z0-9-]+$/, { message: 'skuInvalidFormat' }),
  name: z.string().trim().min(1, { message: 'nameRequired' }),
  category: z.string().trim().min(1, { message: 'categoryRequired' }),
  unit: z.string().trim().min(1, { message: 'unitRequired' }),
  price: z.number().int({ message: 'priceMustBeInteger' }).nonnegative({ message: 'priceMustBeNonNegative' }),
  stock: z.number().int({ message: 'stockMustBeInteger' }).nonnegative({ message: 'stockMustBeNonNegative' }),
  description: z.string().nullable().optional(),
  imageUrl: z
    .string()
    .url({ message: 'imageUrlInvalid' })
    .refine((val) => !val || val.startsWith('https://') || val.startsWith('http://'), {
      message: 'imageUrlInvalidScheme'
    })
    .nullable()
    .optional()
})

export type ProductInput = z.infer<typeof productInputSchema>

/**
 * Validation schema for product catalog creation (Phase 7).
 * STRICT RULE: Completely omits the stock field.
 * Operational stock cannot be mutated via catalog management operations.
 * New products start with stock = 0 by database default.
 */
export const productCatalogInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(3, { message: 'skuTooShort' })
    .max(50, { message: 'skuTooLong' })
    .regex(/^[A-Z0-9-]+$/, { message: 'skuInvalidFormat' }),
  name: z.string().trim().min(1, { message: 'nameRequired' }),
  category: z.string().trim().min(1, { message: 'categoryRequired' }),
  categoryId: z.string().uuid({ message: 'invalidCategoryId' }).nullable().optional(),
  unit: z.string().trim().min(1, { message: 'unitRequired' }),
  price: z.number().int({ message: 'priceMustBeInteger' }).nonnegative({ message: 'priceMustBeNonNegative' }),
  description: z.string().nullable().optional(),
  imageUrl: z
    .union([z.string().trim().url({ message: 'imageUrlInvalid' }), z.literal('')])
    .nullable()
    .optional()
    .refine((val) => !val || val.startsWith('https://') || val.startsWith('http://'), {
      message: 'imageUrlInvalidScheme'
    })
})

export type ProductCatalogInput = z.infer<typeof productCatalogInputSchema>

/**
 * Validation schema for product catalog updates (Phase 7).
 * Requires the product UUID id, and omits the stock field entirely.
 */
export const productCatalogUpdateSchema = productCatalogInputSchema.extend({
  id: z.string().uuid({ message: 'invalidProductId' })
})

export type ProductCatalogUpdate = z.infer<typeof productCatalogUpdateSchema>

/**
 * Validation schema for product category creation (Batch 1).
 */
export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, { message: 'categoryNameTooShort' }).max(100, { message: 'categoryNameTooLong' }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .transform((val) => val.replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, ''))
    .pipe(
      z
        .string()
        .min(2, { message: 'categorySlugTooShort' })
        .max(100, { message: 'categorySlugTooLong' })
        .regex(/^[a-z0-9-]+$/, { message: 'categorySlugInvalidFormat' })
    ),
  description: z.string().trim().max(500, { message: 'categoryDescTooLong' }).nullable().optional()
})

export type CategoryInput = z.infer<typeof categoryInputSchema>

/**
 * Validation schema for product category updates (Batch 1).
 */
export const categoryUpdateSchema = categoryInputSchema.extend({
  id: z.string().uuid({ message: 'invalidCategoryId' })
})

export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>
