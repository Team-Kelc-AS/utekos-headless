import { z } from 'zod'
import type { OsCaravanWeather, OsCaravanWeatherDay } from './parseOsCaravanWeather'

const timeseriesPointSchema = z.object({
  time: z.string(),
  data: z.object({
    instant: z.object({
      details: z.object({
        air_temperature: z.number()
      })
    }),
    next_1_hours: z
      .object({
        summary: z
          .object({
            symbol_code: z.string()
          })
          .optional(),
        details: z
          .object({
            precipitation_amount: z.number().optional()
          })
          .optional()
      })
      .optional(),
    next_6_hours: z
      .object({
        summary: z
          .object({
            symbol_code: z.string()
          })
          .optional(),
        details: z
          .object({
            precipitation_amount: z.number().optional()
          })
          .optional()
      })
      .optional()
  })
})

const locationForecastSchema = z.object({
  properties: z.object({
    timeseries: z.array(timeseriesPointSchema).min(1)
  })
})

const MET_SYMBOL_LABELS: Record<string, string> = {
  clearsky: 'Klart',
  fair: 'Pent',
  partlycloudy: 'Delvis skyet',
  cloudy: 'Overskyet',
  fog: 'Tåke',
  lightrain: 'Lett regn',
  lightrainshowers: 'Lette regnbyger',
  rain: 'Regn',
  rainshowers: 'Regnbyger',
  heavyrain: 'Kraftig regn',
  heavyrainshowers: 'Kraftige regnbyger',
  lightsleet: 'Lett sludd',
  sleet: 'Sludd',
  heavysleet: 'Kraftig sludd',
  lightsnow: 'Lett snø',
  snow: 'Snø',
  heavysnow: 'Kraftig snø',
  thunder: 'Torden'
}

const osloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const osloHourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  hourCycle: 'h23'
})

const weekdayFormatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'short',
  timeZone: 'Europe/Oslo'
})

export function describeMetSymbol(symbolCode: string | undefined): string {
  if (!symbolCode) {
    return 'Værmelding'
  }

  const base = symbolCode.replace(/_(day|night|polartwilight)$/u, '')
  const known = MET_SYMBOL_LABELS[base]
  if (known) {
    return known
  }

  if (base.includes('thunder')) {
    return 'Torden'
  }
  if (base.includes('snow')) {
    return 'Snø'
  }
  if (base.includes('sleet')) {
    return 'Sludd'
  }
  if (base.includes('rain')) {
    return 'Regn'
  }
  if (base.includes('cloud')) {
    return 'Skyet'
  }

  return 'Værmelding'
}

function toOsloDateKey(isoTime: string): string {
  return osloDateFormatter.format(new Date(isoTime))
}

function toOsloHour(isoTime: string): number {
  return Number(osloHourFormatter.format(new Date(isoTime)))
}

function toDayLabel(dateKey: string, index: number): string {
  if (index === 0) {
    return 'I dag'
  }

  const [year, month, day] = dateKey.split('-').map(Number)
  if (
    year === undefined ||
    month === undefined ||
    day === undefined
  ) {
    return dateKey
  }

  return weekdayFormatter
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace(/\.$/, '')
}

function pickDaytimePoint<T extends { time: string }>(points: T[]): T {
  const fallback = points[0]
  if (fallback === undefined) {
    throw new Error('MET Locationforecast day has no timeseries points')
  }

  return (
    points.find(point => {
      const hour = toOsloHour(point.time)
      return hour >= 12 && hour <= 15
    }) ?? fallback
  )
}

export function parseMetLocationForecast(
  payload: unknown
): OsCaravanWeather {
  const forecast = locationForecastSchema.parse(payload)
  const series = forecast.properties.timeseries
  const current = series[0]
  if (current === undefined) {
    throw new Error('MET Locationforecast has no timeseries points')
  }

  const currentSymbol =
    current.data.next_1_hours?.summary?.symbol_code ??
    current.data.next_6_hours?.summary?.symbol_code
  const currentCelsius = Math.round(
    current.data.instant.details.air_temperature
  )

  const grouped = new Map<string, typeof series>()
  for (const point of series) {
    const key = toOsloDateKey(point.time)
    const bucket = grouped.get(key)
    if (bucket) {
      bucket.push(point)
    } else {
      grouped.set(key, [point])
    }
  }

  const days: OsCaravanWeatherDay[] = [...grouped.entries()]
    .slice(0, 5)
    .map(([dateKey, points], index) => {
      const temperatures = points.map(
        point => point.data.instant.details.air_temperature
      )
      const representative = pickDaytimePoint(points)
      const symbol =
        representative.data.next_6_hours?.summary?.symbol_code ??
        representative.data.next_1_hours?.summary?.symbol_code
      const precipitationMm = points.reduce((sum, point) => {
        return (
          sum +
          (point.data.next_1_hours?.details?.precipitation_amount ?? 0)
        )
      }, 0)
      const roundedMm = Math.round(precipitationMm * 10) / 10

      return {
        key: dateKey,
        label: toDayLabel(dateKey, index),
        description: describeMetSymbol(symbol),
        maxCelsius: Math.round(Math.max(...temperatures)),
        minCelsius: Math.round(Math.min(...temperatures)),
        precipitationPercent: roundedMm > 0 ? 100 : 0,
        precipitationLabel:
          roundedMm > 0 ? `${roundedMm}\u00a0mm` : 'Opphold'
      }
    })

  return {
    source: 'met',
    attribution: 'Værvarsel fra Meteorologisk institutt',
    current: {
      celsius: currentCelsius,
      feelsLikeCelsius: currentCelsius,
      description: describeMetSymbol(currentSymbol)
    },
    days
  }
}
