import { parse } from 'date-fns'
import { formatInTimeZone, toDate } from 'date-fns-tz'
import { Venue } from 'wasp/entities'

// Get user's timezone
export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

// Convert local time to UTC for storage
export function localToUTC(date: Date, venue: Venue): Date {
  return toDate(date, { timeZone: venue.timeZoneId })
}

// Convert UTC to local time for display
export function UTCToLocal(date: Date, venue: Venue): Date {
  return toDate(date, { timeZone: venue.timeZoneId })
}

// Format time for display with venue's timezone
export function formatTimeWithZone(date: Date, formatStr: string = 'h:mm a', venue: Venue): string {
  return formatInTimeZone(date, venue.timeZoneId, formatStr)
}

// Parse time string to Date object with venue's timezone
export function parseTimeWithZone(timeStr: string, formatStr: string, baseDate: Date, venue: Venue): Date {
  const parsedDate = parse(timeStr, formatStr, baseDate)
  return localToUTC(parsedDate, venue)
}

// Get start of day in venue's timezone
export function getStartOfDay(date: Date, venue: Venue): Date {
  const localDate = UTCToLocal(date, venue)
  localDate.setHours(0, 0, 0, 0)
  return localToUTC(localDate, venue)
}

// Get end of day in venue's timezone
export function getEndOfDay(date: Date, venue: Venue): Date {
  const localDate = UTCToLocal(date, venue)
  localDate.setHours(23, 59, 59, 999)
  return localToUTC(localDate, venue)
} 