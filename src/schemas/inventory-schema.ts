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
  imageUrl: z.string().url({ message: 'imageUrlInvalid' }).nullable().optional()
})

export type ProductInput = z.infer<typeof productInputSchema>
