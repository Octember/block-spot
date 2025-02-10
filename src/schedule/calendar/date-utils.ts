import { format, formatInTimeZone, toDate } from 'date-fns-tz'
import { parse } from 'date-fns'

// Get user's timezone
export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// Convert local time to UTC for storage
export function localToUTC(date: Date): Date {
  return toDate(date, { timeZone: getUserTimeZone() })
}

// Convert UTC to local time for display
export function UTCToLocal(date: Date): Date {
  return toDate(date, { timeZone: getUserTimeZone() })
}

// Format time for display with timezone consideration
export function formatTimeWithZone(date: Date, formatStr: string = 'h:mm a'): string {
  return formatInTimeZone(date, getUserTimeZone(), formatStr)
}

// Parse time string to Date object with timezone consideration
export function parseTimeWithZone(timeStr: string, formatStr: string, baseDate: Date): Date {
  const parsedDate = parse(timeStr, formatStr, baseDate)
  return localToUTC(parsedDate)
}

// Get start of day in user's timezone
export function getStartOfDay(date: Date): Date {
  const localDate = UTCToLocal(date)
  localDate.setHours(0, 0, 0, 0)
  return localToUTC(localDate)
}

// Get end of day in user's timezone
export function getEndOfDay(date: Date): Date {
  const localDate = UTCToLocal(date)
  localDate.setHours(23, 59, 59, 999)
  return localToUTC(localDate)
} 