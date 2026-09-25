import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { OS_CARAVAN_VENUE } from '../constants/venue'
import { parseMetLocationForecast } from '../utils/parseMetLocationForecast'
import {
  parseOsCaravanWeather,
  type OsCaravanWeather
} from '../utils/parseOsCaravanWeather'

const WEATHER_TIMEOUT_MS = 4000
const MET_LOCATIONFORECAST_URL =
  'https://api.met.no/weatherapi/locationforecast/2.0/compact'
const MET_USER_AGENT = 'utekos.no kundeservice@utekos.no'

function toMetCoordinate(value: number): string {
  return (Math.trunc(value * 10_000) / 10_000).toFixed(4)
}

function createGoogleWeatherUrl(
  pathname: string,
  apiKey: string,
  extraParams?: Record<string, string>
): URL {
  const url = new URL(`https://weather.googleapis.com/v1/${pathname}`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set(
    'location.latitude',
    String(OS_CARAVAN_VENUE.latitude)
  )
  url.searchParams.set(
    'location.longitude',
    String(OS_CARAVAN_VENUE.longitude)
  )
  url.searchParams.set('languageCode', 'nb')
  url.searchParams.set('unitsSystem', 'METRIC')

  if (extraParams) {
    for (const [name, value] of Object.entries(extraParams)) {
      url.searchParams.set(name, value)
    }
  }

  return url
}

async function readJson(
  url: URL,
  init?: RequestInit
): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS),
    ...init
  })

  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`)
  }

  return response.json()
}

async function fetchGoogleWeather(
  apiKey: string
): Promise<OsCaravanWeather> {
  const [currentPayload, forecastPayload] = await Promise.all([
    readJson(createGoogleWeatherUrl('currentConditions:lookup', apiKey)),
    readJson(
      createGoogleWeatherUrl('forecast/days:lookup', apiKey, {
        days: '5'
      })
    )
  ])

  return parseOsCaravanWeather(currentPayload, forecastPayload)
}

async function fetchMetWeather(): Promise<OsCaravanWeather> {
  const url = new URL(MET_LOCATIONFORECAST_URL)
  url.searchParams.set('lat', toMetCoordinate(OS_CARAVAN_VENUE.latitude))
  url.searchParams.set('lon', toMetCoordinate(OS_CARAVAN_VENUE.longitude))

  const payload = await readJson(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MET_USER_AGENT
    }
  })

  return parseMetLocationForecast(payload)
}

export async function fetchOsCaravanWeather(): Promise<OsCaravanWeather | null> {
  'use cache'
  cacheTag('os-caravan-weather')
  cacheLife('hours')

  const apiKey = process.env.GOOGLE_MAPS_KEY?.trim()
  if (apiKey) {
    try {
      return await fetchGoogleWeather(apiKey)
    } catch (error) {
      reportOperationalError({
        event: 'os_caravan_weather_lookup_failed',
        error,
        context: {
          provider: 'google',
          latitude: OS_CARAVAN_VENUE.latitude,
          longitude: OS_CARAVAN_VENUE.longitude
        }
      })
    }
  }

  try {
    return await fetchMetWeather()
  } catch (error) {
    reportOperationalError({
      event: 'os_caravan_weather_lookup_failed',
      error,
      context: {
        provider: 'met',
        latitude: OS_CARAVAN_VENUE.latitude,
        longitude: OS_CARAVAN_VENUE.longitude
      }
    })
    return null
  }
}
