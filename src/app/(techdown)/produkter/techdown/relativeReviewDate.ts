import type { ProductReviewDate } from '@/db/data/reviews/productReviews'

export const REVIEW_TIME_ZONE = 'Europe/Oslo'

const DAY_IN_MS = 86_400_000

type CalendarDate = { year: number; month: number; day: number }

type CalendarDateTime = CalendarDate & {
  hour: number
  minute: number
  second: number
}

const osloDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: REVIEW_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
})

function readNumberPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
) {
  const value = parts.find(part => part.type === type)?.value

  if (!value) {
    throw new Error(`Mangler ${type} i Oslo-datoformattering`)
  }

  return Number(value)
}

function getOsloDateTime(date: Date): CalendarDateTime {
  const parts = osloDateTimeFormatter.formatToParts(date)

  return {
    year: readNumberPart(parts, 'year'),
    month: readNumberPart(parts, 'month'),
    day: readNumberPart(parts, 'day'),
    hour: readNumberPart(parts, 'hour'),
    minute: readNumberPart(parts, 'minute'),
    second: readNumberPart(parts, 'second')
  }
}

function parseIsoCalendarDate(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    throw new Error(`Ugyldig ISO-kalenderdato: ${value}`)
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  }
}

function calendarDayNumber(date: CalendarDate) {
  return Math.floor(
    Date.UTC(date.year, date.month - 1, date.day) / DAY_IN_MS
  )
}

function calendarDayDifference(
  from: CalendarDate,
  to: CalendarDate
) {
  return Math.max(
    0,
    calendarDayNumber(to) - calendarDayNumber(from)
  )
}

function formatMonthOrYearAge(months: number) {
  if (months < 12) {
    return months === 1 ? 'En måned siden' : (
        `${months} måneder siden`
      )
  }

  const years = Math.floor(months / 12)
  return years === 1 ? 'Ett år siden' : `${years} år siden`
}

export function formatExactReviewAge(
  datePublished: string,
  now: Date
) {
  const days = calendarDayDifference(
    parseIsoCalendarDate(datePublished),
    getOsloDateTime(now)
  )

  if (days === 0) return 'I dag'
  if (days === 1) return '1 dag siden'
  if (days <= 30) return `${days} dager siden`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? 'En måned siden' : (
        `${months} måneder siden`
      )
  }

  const years = Math.floor(days / 365)
  return years === 1 ? 'Ett år siden' : `${years} år siden`
}

export function formatReviewAge(
  reviewDate: ProductReviewDate,
  now: Date
) {
  if (reviewDate.type === 'exactDate') {
    return formatExactReviewAge(reviewDate.datePublished, now)
  }

  const elapsedDays = calendarDayDifference(
    parseIsoCalendarDate(reviewDate.observedOn),
    getOsloDateTime(now)
  )
  const elapsedMonths = Math.floor(elapsedDays / 30)

  return formatMonthOrYearAge(
    Math.max(1, reviewDate.months + elapsedMonths)
  )
}

function addOneCalendarDay(date: CalendarDate): CalendarDate {
  const next = new Date(
    Date.UTC(date.year, date.month - 1, date.day + 1)
  )

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  }
}

function osloMidnightToUtc(date: CalendarDate) {
  const targetAsUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day
  )
  let candidate = targetAsUtc

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = getOsloDateTime(new Date(candidate))
    const localAsUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    )
    candidate += targetAsUtc - localAsUtc
  }

  return candidate
}

export function millisecondsUntilNextOsloMidnight(now: Date) {
  const nextDate = addOneCalendarDay(getOsloDateTime(now))
  const nextMidnight = osloMidnightToUtc(nextDate)

  return Math.max(1_000, nextMidnight - now.getTime() + 100)
}
