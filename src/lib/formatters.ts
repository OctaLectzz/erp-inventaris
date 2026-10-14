/**
 * Centralized currency and number formatting utilities for Inventra.
 * Enforces standardized IDR representation, locale-aware punctuation,
 * and elegant compact representations with full precision tooltips.
 */

export interface CurrencyFormatOptions {
  locale?: string
  compact?: boolean
  decimals?: number
  showPrefix?: boolean
}

/**
 * Formats a numeric value into Indonesian Rupiah (IDR).
 *
 * @param amount - Number to format (supports large integers and floats)
 * @param options - Formatting configuration (locale, compact mode, decimal precision)
 * @returns Formatted currency string
 *
 * Examples:
 * - formatCurrencyIDR(6434309760, { locale: 'id' }) => "Rp 6.434.309.760"
 * - formatCurrencyIDR(6434309760, { locale: 'id', compact: true }) => "Rp 6,43 M"
 * - formatCurrencyIDR(6434309760, { locale: 'en' }) => "IDR 6,434,309,760"
 * - formatCurrencyIDR(6434309760, { locale: 'en', compact: true }) => "IDR 6.43 B"
 */
export function formatCurrencyIDR(amount: number, options: CurrencyFormatOptions = {}): string {
  const { locale = 'id', compact = false, decimals = 2, showPrefix = true } = options
  const isId = locale === 'id'

  if (isNaN(amount) || !isFinite(amount)) {
    return isId ? 'Rp 0' : 'IDR 0'
  }

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)
  const sign = isNegative ? '-' : ''
  const prefix = showPrefix ? (isId ? 'Rp ' : 'IDR ') : ''

  if (compact) {
    if (absAmount >= 1_000_000_000_000) {
      const value = absAmount / 1_000_000_000_000
      const formatted = formatDecimal(value, decimals, isId)
      const unit = isId ? ' T' : ' T'
      return `${sign}${prefix}${formatted}${unit}`
    }

    if (absAmount >= 1_000_000_000) {
      const value = absAmount / 1_000_000_000
      const formatted = formatDecimal(value, decimals, isId)
      const unit = isId ? ' M' : ' B'
      return `${sign}${prefix}${formatted}${unit}`
    }

    if (absAmount >= 1_000_000) {
      const value = absAmount / 1_000_000
      const formatted = formatDecimal(value, decimals, isId)
      const unit = isId ? ' Jt' : ' M'
      return `${sign}${prefix}${formatted}${unit}`
    }

    if (absAmount >= 1_000) {
      const value = absAmount / 1_000
      const formatted = formatDecimal(value, 1, isId)
      const unit = isId ? ' Rb' : ' K'
      return `${sign}${prefix}${formatted}${unit}`
    }
  }

  // Full standard currency formatting without abbreviation
  const wholePart = Math.round(absAmount)
  const formattedWhole = formatGroupedInteger(wholePart, isId)

  return `${sign}${prefix}${formattedWhole}`
}

/**
 * Formats a decimal number with locale-appropriate decimal separator (comma for id, period for en).
 * Trims unnecessary trailing zeros (e.g. 6,40 -> 6,4).
 */
function formatDecimal(value: number, maxDecimals: number, isId: boolean): string {
  const fixed = value.toFixed(maxDecimals)
  const trimmed = parseFloat(fixed).toString()
  if (isId) {
    return trimmed.replace('.', ',')
  }
  return trimmed
}

/**
 * Formats an integer with thousand separators (dot for id, comma for en).
 */
function formatGroupedInteger(value: number, isId: boolean): string {
  const str = Math.abs(value).toString()
  const separator = isId ? '.' : ','
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

/**
 * Formats an integer or decimal quantity with standard thousand separators.
 */
export function formatNumber(amount: number, locale = 'id'): string {
  if (isNaN(amount) || !isFinite(amount)) return '0'
  const isId = locale === 'id'
  const isNegative = amount < 0
  const sign = isNegative ? '-' : ''
  const wholePart = Math.round(Math.abs(amount))
  return `${sign}${formatGroupedInteger(wholePart, isId)}`
}
