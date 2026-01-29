// Date formatting options
export type DateStyle = 'full' | 'long' | 'medium' | 'short'

// Format a date according to the current locale
export function formatDate(
  date: Date | string | number,
  locale: string,
  style: DateStyle = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    dateStyle: style,
  }).format(dateObj)
}

// Format a date with time
export function formatDateTime(
  date: Date | string | number,
  locale: string,
  dateStyle: DateStyle = 'medium',
  timeStyle: DateStyle = 'short'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    dateStyle,
    timeStyle,
  }).format(dateObj)
}

// Format relative time (e.g., "2 days ago", "in 3 hours")
export function formatRelativeTime(
  date: Date | string | number,
  locale: string
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale === 'ka' ? 'ka' : 'en', {
    numeric: 'auto',
  })

  // Determine the appropriate unit
  const absDiff = Math.abs(diffInSeconds)

  if (absDiff < 60) {
    return rtf.format(Math.round(diffInSeconds), 'second')
  } else if (absDiff < 3600) {
    return rtf.format(Math.round(diffInSeconds / 60), 'minute')
  } else if (absDiff < 86400) {
    return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
  } else if (absDiff < 2592000) {
    return rtf.format(Math.round(diffInSeconds / 86400), 'day')
  } else if (absDiff < 31536000) {
    return rtf.format(Math.round(diffInSeconds / 2592000), 'month')
  } else {
    return rtf.format(Math.round(diffInSeconds / 31536000), 'year')
  }
}

// Format currency (always USD for this platform)
export function formatCurrency(
  amount: number,
  locale: string,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format a number with locale-specific separators
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US', options).format(value)
}

// Format percentage
export function formatPercent(
  value: number,
  locale: string,
  decimals: number = 0
): string {
  return new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
