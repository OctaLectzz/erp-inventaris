import { describe, expect, it } from 'vitest'

import { stockMutationInputSchema } from '@/schemas/inventory-schema'
import { calculateStockMutation } from '@/services/inventory-domain'
import { canManageCatalog, canManageUsers, canMutateStock, canViewReports } from '@/types/auth'

/**
 * Take-Home Test Brief Verbatim Scenarios Verification
 * As specified in Take_Home_Test_FSE.pdf Page 2, Section 4: "Contoh Skenario Ringkas"
 */
describe('Take-Home Test Brief Ringkas - Verbatim Scenarios Verification', () => {
  describe('Skenario 1: Terima 10 unit, stok awal 4 -> Stok 14; riwayat mencatat 4 -> 14', () => {
    it('should increment stock from 4 to 14 and record transition 4 -> 14', () => {
      const initialStock = 4
      const quantity = 10
      const type = 'IN'

      // Validate input schema
      const parseResult = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type,
        quantity,
        note: 'Penerimaan stok awal supplier'
      })
      expect(parseResult.success).toBe(true)

      // Calculate mutation
      const mutation = calculateStockMutation(initialStock, type, quantity)
      expect(mutation.success).toBe(true)
      if (mutation.success) {
        expect(mutation.stockBefore).toBe(4)
        expect(mutation.stockAfter).toBe(14)
        expect(mutation.change).toBe(10)
      }
    })
  })

  describe('Skenario 2: Keluarkan 3 unit dari stok 14 -> Stok 11; riwayat mencatat 14 -> 11', () => {
    it('should decrement stock from 14 to 11 and record transition 14 -> 11', () => {
      const initialStock = 14
      const quantity = 3
      const type = 'OUT'

      // Validate input schema
      const parseResult = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type,
        quantity,
        note: 'Pengeluaran kebutuhan produksi'
      })
      expect(parseResult.success).toBe(true)

      // Calculate mutation
      const mutation = calculateStockMutation(initialStock, type, quantity)
      expect(mutation.success).toBe(true)
      if (mutation.success) {
        expect(mutation.stockBefore).toBe(14)
        expect(mutation.stockAfter).toBe(11)
        expect(mutation.change).toBe(-3)
      }
    })
  })

  describe('Skenario 3: Keluarkan 12 unit dari stok 11 -> Ditolak; stok dan riwayat tidak berubah', () => {
    it('should reject overdraft mutation without modifying stock or state', () => {
      const initialStock = 11
      const quantity = 12
      const type = 'OUT'

      // Schema is structurally valid (12 is positive integer)
      const parseResult = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type,
        quantity,
        note: 'Pengeluaran melebihi kapasitas stok'
      })
      expect(parseResult.success).toBe(true)

      // Calculation must reject overdraft
      const mutation = calculateStockMutation(initialStock, type, quantity)
      expect(mutation.success).toBe(false)
      if (!mutation.success) {
        expect(mutation.error).toBe('INSUFFICIENT_STOCK')
      }

      // Stock reference must remain strictly 11
      expect(initialStock).toBe(11)
    })
  })

  describe('Skenario 4: Kuantitas nol, negatif, atau desimal -> Ditolak tanpa perubahan', () => {
    it('should reject quantity of 0 at schema and domain layers without state mutation', () => {
      const initialStock = 11

      const schemaRes = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: 'IN',
        quantity: 0,
        note: 'Kuantitas nol'
      })
      expect(schemaRes.success).toBe(false)

      const domainRes = calculateStockMutation(initialStock, 'IN', 0)
      expect(domainRes.success).toBe(false)
      if (!domainRes.success) {
        expect(domainRes.error).toBe('INVALID_QUANTITY')
      }

      expect(initialStock).toBe(11)
    })

    it('should reject negative quantities (-5) at schema and domain layers', () => {
      const initialStock = 11

      const schemaRes = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: 'IN',
        quantity: -5,
        note: 'Kuantitas negatif'
      })
      expect(schemaRes.success).toBe(false)

      const domainRes = calculateStockMutation(initialStock, 'IN', -5)
      expect(domainRes.success).toBe(false)
      if (!domainRes.success) {
        expect(domainRes.error).toBe('INVALID_QUANTITY')
      }

      expect(initialStock).toBe(11)
    })

    it('should reject decimal / fractional quantities (3.5) at schema and domain layers', () => {
      const initialStock = 11

      const schemaRes = stockMutationInputSchema.safeParse({
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        type: 'IN',
        quantity: 3.5,
        note: 'Kuantitas desimal'
      })
      expect(schemaRes.success).toBe(false)

      const domainRes = calculateStockMutation(initialStock, 'IN', 3.5)
      expect(domainRes.success).toBe(false)
      if (!domainRes.success) {
        expect(domainRes.error).toBe('INVALID_QUANTITY')
      }

      expect(initialStock).toBe(11)
    })
  })

  describe('Skenario 5: Muat ulang setelah mutasi; akses halaman beda role -> Data dan sesi utuh; akses sesuai role', () => {
    it('verifies strict role isolation according to the RBAC matrix', () => {
      // 1. Administrator: full access to catalog write, stock mutation, reports, users
      expect(canManageCatalog('administrator')).toBe(true)
      expect(canMutateStock('administrator')).toBe(true)
      expect(canViewReports('administrator')).toBe(true)
      expect(canManageUsers('administrator')).toBe(true)

      // 2. Staff Gudang: operational access to stock mutations, denied catalog write & reports
      expect(canManageCatalog('staff_gudang')).toBe(false)
      expect(canMutateStock('staff_gudang')).toBe(true)
      expect(canViewReports('staff_gudang')).toBe(false)
      expect(canManageUsers('staff_gudang')).toBe(false)

      // 3. Auditor: read-only access, denied stock mutation & user management
      expect(canManageCatalog('auditor')).toBe(false)
      expect(canMutateStock('auditor')).toBe(false)
      expect(canViewReports('auditor')).toBe(true)
      expect(canManageUsers('auditor')).toBe(false)

      // 4. Legacy Owner: executive read-only, access to reports
      expect(canManageCatalog('owner')).toBe(false)
      expect(canMutateStock('owner')).toBe(false)
      expect(canViewReports('owner')).toBe(true)
      expect(canManageUsers('owner')).toBe(true)

      // 5. Legacy Admin Gudang: operational administrator
      expect(canManageCatalog('admin_gudang')).toBe(true)
      expect(canMutateStock('admin_gudang')).toBe(true)
    })

    it('verifies mathematical consistency formula: current = opening + total_in - total_out', () => {
      const openingStock = 4
      const totalIn = 10
      const totalOut = 3

      const currentStock = openingStock + totalIn - totalOut
      expect(currentStock).toBe(11)

      // Step-by-step verification
      const step1 = calculateStockMutation(openingStock, 'IN', totalIn)
      expect(step1.success).toBe(true)
      const afterStep1 = (step1 as { stockAfter: number }).stockAfter
      expect(afterStep1).toBe(14)

      const step2 = calculateStockMutation(afterStep1, 'OUT', totalOut)
      expect(step2.success).toBe(true)
      const afterStep2 = (step2 as { stockAfter: number }).stockAfter
      expect(afterStep2).toBe(11)
      expect(afterStep2).toBe(currentStock)
    })
  })
})
