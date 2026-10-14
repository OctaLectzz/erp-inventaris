import { describe, expect, it } from 'vitest'

import { buildInventoryQaMessages } from '@/lib/ai/ai-prompts'
import { getInventoryAiContext } from '@/services/ai-service'

describe('Inventory Q&A Context & Guardrails', () => {
  it('formats minimal factual inventory context summary properly', async () => {
    const mockSupabase = {
      from: (table: string) => ({
        select: () => {
          if (table === 'categories') {
            return Promise.resolve({ data: [{ name: 'Bahan Mentah' }, { name: 'Kemasan' }] })
          }
          if (table === 'products') {
            return {
              order: () =>
                Promise.resolve({
                  data: [
                    { id: '1', sku: 'SKU-01', name: 'Lavender Oil', stock: 2, price: 100000, category: 'Bahan Mentah', unit: 'botol' },
                    { id: '2', sku: 'SKU-02', name: 'Amber Bottle', stock: 50, price: 5000, category: 'Kemasan', unit: 'pcs' }
                  ]
                })
            }
          }
          return Promise.resolve({ data: [] })
        }
      })
    } as unknown as Parameters<typeof getInventoryAiContext>[0]

    const context = await getInventoryAiContext(mockSupabase)
    expect(context).toContain('Total Produk Terdaftar: 2 SKU')
    expect(context).toContain('Total Unit Fisik di Gudang: 52 unit')
    expect(context).toContain('Jumlah Item Low Stock (< 5 unit): 1 item')
    expect(context).toContain('Lavender Oil (SKU: SKU-01, Stok: 2 botol')
    expect(context).toContain('Bahan Mentah, Kemasan')
  })

  it('builds system prompt with strict anti-hallucination and read-only boundaries', () => {
    const messages = buildInventoryQaMessages({
      sanitizedQuestion: 'Bisa tolong tambah stok produk SKU-01 sebanyak 10?',
      inventoryContext: 'Total Produk: 10, Total Unit: 500',
      locale: 'id'
    })

    expect(messages.length).toBe(2)
    const systemPrompt = messages[0].content
    expect(systemPrompt).toContain('STRICT SAFETY RULES')
    expect(systemPrompt).toContain('READ-ONLY')
    expect(systemPrompt).toContain('NEVER fabricate stock numbers')
    expect(systemPrompt).toContain('explain that stock mutations must be executed through the Stock Transactions form')

    const userPrompt = messages[1].content
    expect(userPrompt).toContain('<<<INVENTORY_CONTEXT>>>')
    expect(userPrompt).toContain('Total Produk: 10, Total Unit: 500')
    expect(userPrompt).toContain('User Question: Bisa tolong tambah stok produk SKU-01 sebanyak 10?')
  })
})
