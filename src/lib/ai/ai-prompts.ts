import 'server-only'

import type { NineRouterMessage } from './nine-router-client'

/**
 * Builds messages for generating a product draft from user notes or product title.
 * Enforces structured JSON output matching aiProductDraftResponseSchema.
 */
export function buildProductDraftMessages(params: {
  sanitizedPrompt: string
  categoryHint?: string
  existingCategories: string[]
  locale: string
}): NineRouterMessage[] {
  const { sanitizedPrompt, categoryHint, existingCategories, locale } = params
  const isEn = locale === 'en'

  const categoriesList = existingCategories.length > 0 ? existingCategories.join(', ') : 'Umum, Bahan Baku, Kemasan'

  const systemContent = `You are an expert Warehouse Inventory Catalog Assistant for Inventra ERP.
Your task is to draft a structured product catalog entry based ONLY on the user-provided item description or title.

CRITICAL INVARIANTS:
1. Distinguish user-provided facts from your suggestions/assumptions.
2. Output MUST be strictly valid JSON matching this schema:
{
  "name": "Standardized Product Name",
  "sku": "UPPERCASE-ALPHANUMERIC-SKU",
  "category": "Matched or suggested category",
  "unit": "pcs | botol | box | kg | liter | etc",
  "price": 0,
  "description": "Standard catalog description",
  "specifications": [
    { "key": "Attribute Name", "value": "Attribute Value", "isAssumption": true/false }
  ],
  "notes": "Clarification notes on what was assumed vs provided",
  "imagePrompt": "A clean studio mockup prompt for generating product image",
  "assumptions": ["List of assumptions made"]
}
3. SKU MUST match /^[A-Z0-9-]+$/ (uppercase letters, numbers, and hyphens only, min 3 chars).
4. Category should ideally match one of these existing categories: [${categoriesList}]. If categoryHint is given, prioritize it.
5. Price must be a non-negative integer (in IDR). If price cannot be reasonably estimated, set to 0 and note it in assumptions.
6. Opening stock is ALWAYS 0 and cannot be set here.
7. Return ONLY the JSON object without commentary or markdown code blocks.`

  const userContent = `Available Categories: ${categoriesList}
${categoryHint ? `User Category Hint: ${categoryHint}` : ''}
Language: ${isEn ? 'English' : 'Indonesian'}

<<<USER_DATA>>>
${sanitizedPrompt}
<<<END_USER_DATA>>>

Generate the JSON product draft now:`

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ]
}

/**
 * Builds messages for refining or restructuring product descriptions and specifications.
 */
export function buildDescriptionRefineMessages(params: {
  sanitizedText: string
  mode: 'expand' | 'shorten' | 'specifications' | 'translate'
  locale: string
}): NineRouterMessage[] {
  const { sanitizedText, mode, locale } = params
  const isEn = locale === 'en'

  let instruction = ''
  switch (mode) {
    case 'expand':
      instruction = isEn
        ? 'Expand the product description with clear, professional warehouse and logistics terminology. Keep facts intact.'
        : 'Perjelas dan lengkapi deskripsi produk dengan istilah pergudangan dan logistik yang profesional dan baku. Pertahankan fakta asli.'
      break
    case 'shorten':
      instruction = isEn
        ? 'Shorten the description to a concise 1-2 sentence summary suitable for warehouse catalog cards.'
        : 'Ringkas deskripsi menjadi 1-2 kalimat padat yang mudah dibaca pada kartu katalog gudang.'
      break
    case 'specifications':
      instruction = isEn
        ? 'Format technical specifications clearly into bullet points (e.g. Dimensions, Weight, Material, Storage Condition).'
        : 'Ekstrak dan susun spesifikasi teknis dalam format poin-poin terstruktur (misal: Dimensi, Berat, Material, Ketentuan Simpan).'
      break
    case 'translate':
      instruction = isEn
        ? 'Translate the product description into natural, professional Indonesian.'
        : 'Terjemahkan deskripsi produk ke dalam Bahasa Inggris profesional.'
      break
  }

  const systemContent = `You are a professional warehouse catalog copy editor.
Rules:
- Preserve all user-provided facts (dimensions, ingredients, materials).
- Do not invent unsubstantiated technical claims.
- Return ONLY the refined text.`

  const userContent = `Mode: ${mode}
Instruction: ${instruction}

<<<RAW_CONTENT>>>
${sanitizedText}
<<<END_RAW_CONTENT>>>`

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ]
}

/**
 * Builds messages for answering inventory questions based strictly on factual server data.
 */
export function buildInventoryQaMessages(params: { sanitizedQuestion: string; inventoryContext: string; locale: string }): NineRouterMessage[] {
  const { sanitizedQuestion, inventoryContext, locale } = params
  const isEn = locale === 'en'

  const systemContent = `You are an AI Inventory Assistant for Inventra ERP.
Your task is to answer user questions about warehouse inventory based STRICTLY on the authorized context below.

STRICT SAFETY RULES:
1. Answer using ONLY facts from <<<INVENTORY_CONTEXT>>>.
2. If data is not present in the context (e.g. specific unlisted transactions or future predictions), state clearly that the data is not available.
3. NEVER fabricate stock numbers, prices, or past movements.
4. You have READ-ONLY visibility. You CANNOT mutate stock, create products, or run SQL.
5. If the user asks you to perform a stock change or database action, politely explain that stock mutations must be executed through the Stock Transactions form.
6. Answer politely and concisely in ${isEn ? 'English' : 'Indonesian'}.`

  const userContent = `<<<INVENTORY_CONTEXT>>>
${inventoryContext}
<<<END_INVENTORY_CONTEXT>>>

User Question: ${sanitizedQuestion}`

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ]
}
