/**
 * Domain types for Batch 4 — AI Assistant Integration.
 */

export interface AiSpecificationItem {
  key: string
  value: string
  isAssumption: boolean
}

export interface AiProductDraft {
  name: string
  sku: string
  category: string
  unit: string
  price: number
  description: string
  specifications: AiSpecificationItem[]
  notes: string
  imagePrompt?: string
  assumptions: string[]
}

export type AiRefineMode = 'expand' | 'shorten' | 'specifications' | 'translate'

export interface AiRefineResult {
  original: string
  refined: string
  mode: AiRefineMode
  notes?: string
}

export interface AiInventoryAnswer {
  question: string
  answer: string
  contextSummary: string
  sources: string[]
}

export interface AiConfigStatus {
  isConfigured: boolean
  hasModel: boolean
  endpoint: string
  modelName?: string
}

export type AiActionResult<T> = { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }
