import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { OS_CARAVAN_VENUE } from '../constants/venue'
import {
  parseOsCaravanAir,
  parseOsCaravanDrive,
  parseOsCaravanPlace,
  type OsCaravanPlaceFacts
} from '../utils/parseOsCaravanVisitFacts'

const LOOKUP_TIMEOUT_MS = 4000
const OS_CARAVAN_PLACE_ID = 'ChIJjVLtiF9ZPEYRyzDbjoTMijE'
const DRIVE_ORIGIN = 'Bergen stasjon, Norge'

export type OsCaravanVisitFacts = OsCaravanPlaceFacts & {
  driveLabel: string | null
  airQualityLabel: string | null
}

const emptyFacts: OsCaravanVisitFacts = {
  ratingLabel: null,
  reviewsHref: null,
  driveLabel: null,
  airQualityLabel: null
}

async function readJson(
  url: string,
  apiKey: string,
  init?: RequestInit & { fieldMask?: string }
): Promise<unknown> {
  const headers = new Headers(init?.headers)
  headers.set('X-Goog-Api-Key', apiKey)
  if (init?.fieldMask) {
    headers.set('X-Goog-FieldMask', init.fieldMask)
  }

  const response = await fetch(url, {
    method: init?.method,
    body: init?.body,
    headers,
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS)
  })

  if (!response.ok) {
    throw new Error(`Os Caravan lookup returned ${response.status}`)
  }

  return response.json()
}

async function fetchPlace(apiKey: string): Promise<OsCaravanPlaceFacts> {
  const payload = await readJson(
    `https://places.googleapis.com/v1/places/${OS_CARAVAN_PLACE_ID}?languageCode=nb`,
    apiKey,
    {
      fieldMask:
        'rating,userRatingCount,googleMapsLinks.reviewsUri,googleMapsLinks.placeUri'
    }
  )

  return parseOsCaravanPlace(payload)
}

async function fetchDrive(apiKey: string): Promise<string | null> {
  const payload = await readJson(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    apiKey,
    {
      method: 'POST',
      fieldMask: 'routes.localizedValues',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { address: DRIVE_ORIGIN },
        destination: { placeId: OS_CARAVAN_PLACE_ID },
        travelMode: 'DRIVE',
        languageCode: 'nb',
        units: 'METRIC'
      })
    }
  )

  return parseOsCaravanDrive(payload)
}

async function fetchAir(apiKey: string): Promise<string | null> {
  const payload = await readJson(
    'https://airquality.googleapis.com/v1/currentConditions:lookup',
    apiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: {
          latitude: OS_CARAVAN_VENUE.latitude,
          longitude: OS_CARAVAN_VENUE.longitude
        },
        languageCode: 'nb'
      })
    }
  )

  return parseOsCaravanAir(payload)
}

async function readFact<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await read()
  } catch (error) {
    reportOperationalError({
      event: 'os_caravan_visit_fact_failed',
      error,
      context: { fact: label }
    })
    return fallback
  }
}

export async function fetchOsCaravanVisitFacts(): Promise<OsCaravanVisitFacts> {
  'use cache'
  cacheTag('os-caravan-visit-facts')
  cacheLife('hours')

  const apiKey = process.env.GOOGLE_MAPS_KEY?.trim()
  if (!apiKey) {
    return emptyFacts
  }

  const [place, driveLabel, airQualityLabel] = await Promise.all([
    readFact('place', () => fetchPlace(apiKey), {
      ratingLabel: null,
      reviewsHref: null
    }),
    readFact('drive', () => fetchDrive(apiKey), null),
    readFact('air', () => fetchAir(apiKey), null)
  ])

  return {
    ...place,
    driveLabel,
    airQualityLabel
  }
}
