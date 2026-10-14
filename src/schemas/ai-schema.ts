import { z } from 'zod'

/**
 * Validation schema for requesting an AI-generated product draft.
 */
export const aiProductDraftRequestSchema = z.object({
  prompt: z.string().trim().min(2, { message: 'promptTooShort' }).max(500, { message: 'promptTooLong' }),
  categoryHint: z.string().trim().max(100).optional(),
  locale: z.enum(['id', 'en']).default('id')
})

export type AiProductDraftRequest = z.infer<typeof aiProductDraftRequestSchema>

/**
 * Specification attribute item schema.
 */
export const aiSpecificationItemSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
  isAssumption: z.boolean().default(false)
})

/**
 * Strict schema for parsing and validating structured AI model output for product drafts.
 * Ensures model recommendations conform strictly to database and domain types.
 */
export const aiProductDraftResponseSchema = z.object({
  name: z.string().trim().min(1, { message: 'nameRequired' }).max(200),
  sku: z
    .string()
    .trim()
    .min(3, { message: 'skuTooShort' })
    .max(50, { message: 'skuTooLong' })
    .regex(/^[A-Z0-9-]+$/, { message: 'skuInvalidFormat' }),
  category: z.string().trim().min(1, { message: 'categoryRequired' }),
  unit: z.string().trim().min(1, { message: 'unitRequired' }),
  price: z.number().int({ message: 'priceMustBeInteger' }).nonnegative({ message: 'priceMustBeNonNegative' }),
  description: z.string().trim().default(''),
  specifications: z.array(aiSpecificationItemSchema).default([]),
  notes: z.string().trim().default(''),
  imagePrompt: z.string().trim().optional(),
  assumptions: z.array(z.string().trim()).default([])
})

export type AiProductDraftResponse = z.infer<typeof aiProductDraftResponseSchema>

/**
 * Validation schema for refining/formatting a product description or specification.
 */
export const aiRefineDescriptionRequestSchema = z.object({
  text: z.string().trim().min(3, { message: 'textTooShort' }).max(2000, { message: 'textTooLong' }),
  mode: z.enum(['expand', 'shorten', 'specifications', 'translate'], {
    message: 'invalidRefineMode'
  }),
  locale: z.enum(['id', 'en']).default('id')
})

export type AiRefineDescriptionRequest = z.infer<typeof aiRefineDescriptionRequestSchema>

/**
 * Validation schema for asking natural language questions about authorized inventory.
 */
export const aiInventoryQuestionRequestSchema = z.object({
  question: z.string().trim().min(3, { message: 'questionTooShort' }).max(500, { message: 'questionTooLong' }),
  locale: z.enum(['id', 'en']).default('id')
})

export type AiInventoryQuestionRequest = z.infer<typeof aiInventoryQuestionRequestSchema>
