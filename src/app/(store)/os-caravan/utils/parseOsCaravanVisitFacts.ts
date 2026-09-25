import { z } from 'zod'

const placeSchema = z.object({
  rating: z.number().optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  googleMapsLinks: z
    .object({
      reviewsUri: z.url().optional(),
      placeUri: z.url().optional()
    })
    .optional()
})

const routeSchema = z.object({
  routes: z
    .array(
      z.object({
        localizedValues: z
          .object({
            distance: z.object({ text: z.string().min(1) }).optional(),
            duration: z.object({ text: z.string().min(1) }).optional()
          })
          .optional()
      })
    )
    .min(1)
})

const airSchema = z.object({
  indexes: z.array(
    z.object({
      code: z.string(),
      category: z.string().min(1).optional()
    })
  )
})

const ratingFormat = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
})

const osloWeekday = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Oslo',
  weekday: 'short'
})

const osloClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

/** Minutes from midnight, Europe/Oslo. Sunday is closed. */
const OPEN_MINUTES: Record<string, readonly [number, number] | null> = {
  Mon: [9 * 60, 17 * 60],
  Tue: [9 * 60, 17 * 60],
  Wed: [9 * 60, 17 * 60],
  Thu: [9 * 60, 19 * 60],
  Fri: [9 * 60, 17 * 60],
  Sat: [10 * 60, 15 * 60],
  Sun: null
}

export type OsCaravanPlaceFacts = {
  ratingLabel: string | null
  reviewsHref: string | null
}

export function describeOsCaravanOpenState(
  now = new Date()
): 'Åpent nå' | 'Stengt nå' {
  const weekday = osloWeekday.format(now)
  const window = OPEN_MINUTES[weekday]
  if (!window) {
    return 'Stengt nå'
  }

  const [hour, minute] = osloClock.format(now).split(':').map(Number)
  if (hour === undefined || minute === undefined) {
    return 'Stengt nå'
  }

  const minutes = hour * 60 + minute
  const [opens, closes] = window

  return minutes >= opens && minutes < closes ? 'Åpent nå' : 'Stengt nå'
}

export function parseOsCaravanPlace(payload: unknown): OsCaravanPlaceFacts {
  const place = placeSchema.parse(payload)
  const reviewsHref =
    place.googleMapsLinks?.reviewsUri ??
    place.googleMapsLinks?.placeUri ??
    null

  if (place.rating == null || place.userRatingCount == null) {
    return { ratingLabel: null, reviewsHref }
  }

  const reviews =
    place.userRatingCount === 1 ? '1 anmeldelse' : `${place.userRatingCount} anmeldelser`

  return {
    ratingLabel: `${ratingFormat.format(place.rating)} · ${reviews} på Google`,
    reviewsHref
  }
}

export function parseOsCaravanDrive(payload: unknown): string | null {
  const route = routeSchema.parse(payload)
  const values = route.routes[0]?.localizedValues
  const duration = values?.duration?.text
  const distance = values?.distance?.text

  if (!duration || !distance) {
    return null
  }

  return `${duration} og ${distance} fra Bergen stasjon`
}

export function parseOsCaravanAir(payload: unknown): string | null {
  const air = airSchema.parse(payload)
  return air.indexes.find(index => index.code === 'uaqi')?.category ?? null
}
