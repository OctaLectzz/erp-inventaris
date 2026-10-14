export type PeriodKey = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all'

export interface DateRangeResult {
  startIso?: string
  endIso?: string
  startDate?: string
  endDate?: string
  period: PeriodKey
  bucketType: 'hour' | 'day' | 'month'
}

/**
 * Pads a single-digit number with leading zero.
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
export function formatLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Calculates start and end ISO timestamps and bucket intervals for analytics filtering.
 *
 * INVARIANTS:
 * 1. Consistent daily boundaries: start at 00:00:00.000Z and end at 23:59:59.999Z.
 * 2. Guaranteed chronological ordering: startIso <= endIso when both are defined.
 * 3. Zero-mutation: Does not modify the input reference date.
 */
export function calculateDateBoundaries(
  period: PeriodKey,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): DateRangeResult {
  const ref = new Date(referenceDate)

  if (period === 'all') {
    return {
      period: 'all',
      bucketType: 'month'
    }
  }

  if (period === 'today') {
    const ymd = formatLocalYmd(ref)
    return {
      startIso: new Date(`${ymd}T00:00:00.000Z`).toISOString(),
      endIso: new Date(`${ymd}T23:59:59.999Z`).toISOString(),
      startDate: ymd,
      endDate: ymd,
      period: 'today',
      bucketType: 'hour'
    }
  }

  if (period === 'week') {
    const endDate = new Date(ref)
    const startDate = new Date(ref)
    startDate.setDate(startDate.getDate() - 6) // Past 7 days including today

    const startYmd = formatLocalYmd(startDate)
    const endYmd = formatLocalYmd(endDate)

    return {
      startIso: new Date(`${startYmd}T00:00:00.000Z`).toISOString(),
      endIso: new Date(`${endYmd}T23:59:59.999Z`).toISOString(),
      startDate: startYmd,
      endDate: endYmd,
      period: 'week',
      bucketType: 'day'
    }
  }

  if (period === 'month') {
    const endDate = new Date(ref)
    const startDate = new Date(ref)
    startDate.setDate(startDate.getDate() - 29) // Past 30 days including today

    const startYmd = formatLocalYmd(startDate)
    const endYmd = formatLocalYmd(endDate)

    return {
      startIso: new Date(`${startYmd}T00:00:00.000Z`).toISOString(),
      endIso: new Date(`${endYmd}T23:59:59.999Z`).toISOString(),
      startDate: startYmd,
      endDate: endYmd,
      period: 'month',
      bucketType: 'day'
    }
  }

  if (period === 'year') {
    const endDate = new Date(ref)
    const startDate = new Date(ref.getFullYear(), 0, 1) // Start of current year

    const startYmd = formatLocalYmd(startDate)
    const endYmd = formatLocalYmd(endDate)

    return {
      startIso: new Date(`${startYmd}T00:00:00.000Z`).toISOString(),
      endIso: new Date(`${endYmd}T23:59:59.999Z`).toISOString(),
      startDate: startYmd,
      endDate: endYmd,
      period: 'year',
      bucketType: 'month'
    }
  }

  // Custom range
  let startIso: string | undefined
  let endIso: string | undefined
  let cleanStart: string | undefined
  let cleanEnd: string | undefined

  if (customStart && customStart.trim().length > 0) {
    cleanStart = customStart.trim()
    const pStart = new Date(`${cleanStart}T00:00:00.000Z`)
    if (!isNaN(pStart.getTime())) {
      startIso = pStart.toISOString()
    }
  }

  if (customEnd && customEnd.trim().length > 0) {
    cleanEnd = customEnd.trim()
    const pEnd = new Date(`${cleanEnd}T23:59:59.999Z`)
    if (!isNaN(pEnd.getTime())) {
      endIso = pEnd.toISOString()
    }
  }

  // Fallback if start is after end
  if (startIso && endIso && startIso > endIso) {
    // Swap safely
    const temp = startIso
    startIso = endIso
    endIso = temp
    const tempStr = cleanStart
    cleanStart = cleanEnd
    cleanEnd = tempStr
  }

  // Determine bucket type based on day span
  let bucketType: 'hour' | 'day' | 'month' = 'day'
  if (startIso && endIso) {
    const diffDays = Math.ceil((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) {
      bucketType = 'hour'
    } else if (diffDays > 90) {
      bucketType = 'month'
    }
  }

  return {
    startIso,
    endIso,
    startDate: cleanStart,
    endDate: cleanEnd,
    period: 'custom',
    bucketType
  }
}
