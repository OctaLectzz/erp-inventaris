import { describe, expect, it } from 'vitest'

import { formatCurrencyIDR, formatNumber } from '@/lib/formatters'

describe('formatCurrencyIDR - Indonesian Rupiah Formatter', () => {
  describe('Full Standard Currency Formatting', () => {
    it('formats typical zero and small amounts in ID locale', () => {
      expect(formatCurrencyIDR(0, { locale: 'id' })).toBe('Rp 0')
      expect(formatCurrencyIDR(500, { locale: 'id' })).toBe('Rp 500')
      expect(formatCurrencyIDR(15000, { locale: 'id' })).toBe('Rp 15.000')
    })

    it('formats multi-million amounts with dot thousands separator in ID locale', () => {
      expect(formatCurrencyIDR(2500000, { locale: 'id' })).toBe('Rp 2.500.000')
      expect(formatCurrencyIDR(125450000, { locale: 'id' })).toBe('Rp 125.450.000')
    })

    it('formats multi-billion valuations with dot thousands separator in ID locale', () => {
      expect(formatCurrencyIDR(6434309760, { locale: 'id' })).toBe('Rp 6.434.309.760')
    })

    it('formats amounts in EN locale with comma separator and IDR prefix', () => {
      expect(formatCurrencyIDR(0, { locale: 'en' })).toBe('IDR 0')
      expect(formatCurrencyIDR(15000, { locale: 'en' })).toBe('IDR 15,000')
      expect(formatCurrencyIDR(6434309760, { locale: 'en' })).toBe('IDR 6,434,309,760')
    })

    it('handles negative currency values correctly', () => {
      expect(formatCurrencyIDR(-50000, { locale: 'id' })).toBe('-Rp 50.000')
      expect(formatCurrencyIDR(-50000, { locale: 'en' })).toBe('-IDR 50,000')
    })

    it('handles NaN and non-finite values safely', () => {
      expect(formatCurrencyIDR(NaN, { locale: 'id' })).toBe('Rp 0')
      expect(formatCurrencyIDR(Infinity, { locale: 'id' })).toBe('Rp 0')
    })
  })

  describe('Compact Currency Notation (for KPI cards)', () => {
    it('formats billions (Miliar) in ID locale with comma decimal separator', () => {
      expect(formatCurrencyIDR(6434309760, { locale: 'id', compact: true })).toBe('Rp 6,43 M')
      expect(formatCurrencyIDR(1000000000, { locale: 'id', compact: true })).toBe('Rp 1 M')
      expect(formatCurrencyIDR(12500000000, { locale: 'id', compact: true })).toBe('Rp 12,5 M')
    })

    it('formats billions (Billion) in EN locale with period decimal separator', () => {
      expect(formatCurrencyIDR(6434309760, { locale: 'en', compact: true })).toBe('IDR 6.43 B')
      expect(formatCurrencyIDR(1000000000, { locale: 'en', compact: true })).toBe('IDR 1 B')
    })

    it('formats millions (Juta) in ID locale', () => {
      expect(formatCurrencyIDR(250500000, { locale: 'id', compact: true })).toBe('Rp 250,5 Jt')
      expect(formatCurrencyIDR(1000000, { locale: 'id', compact: true })).toBe('Rp 1 Jt')
    })

    it('formats millions (M) in EN locale', () => {
      expect(formatCurrencyIDR(250500000, { locale: 'en', compact: true })).toBe('IDR 250.5 M')
    })

    it('formats thousands in ID and EN locale', () => {
      expect(formatCurrencyIDR(750000, { locale: 'id', compact: true })).toBe('Rp 750 Rb')
      expect(formatCurrencyIDR(750000, { locale: 'en', compact: true })).toBe('IDR 750 K')
    })

    it('formats trillions in ID and EN locale', () => {
      expect(formatCurrencyIDR(2500000000000, { locale: 'id', compact: true })).toBe('Rp 2,5 T')
      expect(formatCurrencyIDR(2500000000000, { locale: 'en', compact: true })).toBe('IDR 2.5 T')
    })
  })
})

describe('formatNumber - Standard Integer/Quantity Formatter', () => {
  it('formats counts with thousand separators', () => {
    expect(formatNumber(0, 'id')).toBe('0')
    expect(formatNumber(150, 'id')).toBe('150')
    expect(formatNumber(1250, 'id')).toBe('1.250')
    expect(formatNumber(1250, 'en')).toBe('1,250')
    expect(formatNumber(1000000, 'id')).toBe('1.000.000')
  })
})
