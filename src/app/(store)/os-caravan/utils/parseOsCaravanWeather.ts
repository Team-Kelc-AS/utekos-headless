import { z } from 'zod'

const temperatureSchema = z.object({
  degrees: z.number()
})

const weatherConditionSchema = z.object({
  iconBaseUri: z.url(),
  description: z.object({
    text: z.string().min(1)
  })
})

const currentConditionsSchema = z.object({
  temperature: temperatureSchema,
  feelsLikeTemperature: temperatureSchema,
  weatherCondition: weatherConditionSchema
})

const forecastDaySchema = z.object({
  displayDate: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31)
  }),
  maxTemperature: temperatureSchema,
  minTemperature: temperatureSchema,
  daytimeForecast: z.object({
    weatherCondition: weatherConditionSchema,
    precipitation: z
      .object({
        probability: z
          .object({
            percent: z.number()
          })
          .optional()
      })
      .optional()
  })
})

const dailyForecastSchema = z.object({
  forecastDays: z.array(forecastDaySchema).min(1)
})

export type OsCaravanWeatherDay = {
  key: string
  label: string
  description: string
  iconSrc?: string
  maxCelsius: number
  minCelsius: number
  precipitationLabel: string
  precipitationPercent: number
}

export type OsCaravanWeather = {
  source: 'google' | 'met'
  attribution: string
  current: {
    celsius: number
    feelsLikeCelsius: number
    description: string
    iconSrc?: string
  }
  days: OsCaravanWeatherDay[]
}

const weekdayFormatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'short',
  timeZone: 'Europe/Oslo'
})

function toDarkWeatherIcon(iconBaseUri: string): string {
  return `${iconBaseUri}_dark.svg`
}

function toRoundedCelsius(degrees: number): number {
  return Math.round(degrees)
}

function toDayLabel(
  date: { year: number; month: number; day: number },
  index: number
): string {
  if (index === 0) {
    return 'I dag'
  }

  const weekday = weekdayFormatter.format(
    new Date(Date.UTC(date.year, date.month - 1, date.day, 12))
  )

  return weekday.replace(/\.$/, '')
}

export function parseOsCaravanWeather(
  currentPayload: unknown,
  forecastPayload: unknown
): OsCaravanWeather {
  const current = currentConditionsSchema.parse(currentPayload)
  const forecast = dailyForecastSchema.parse(forecastPayload)

  return {
    source: 'google',
    attribution: '',
    current: {
      celsius: toRoundedCelsius(current.temperature.degrees),
      feelsLikeCelsius: toRoundedCelsius(
        current.feelsLikeTemperature.degrees
      ),
      description: current.weatherCondition.description.text,
      iconSrc: toDarkWeatherIcon(current.weatherCondition.iconBaseUri)
    },
    days: forecast.forecastDays.slice(0, 5).map((day, index) => {
      const precipitationPercent =
        day.daytimeForecast.precipitation?.probability?.percent ?? 0

      return {
        key: `${day.displayDate.year}-${day.displayDate.month}-${day.displayDate.day}`,
        label: toDayLabel(day.displayDate, index),
        description: day.daytimeForecast.weatherCondition.description.text,
        iconSrc: toDarkWeatherIcon(
          day.daytimeForecast.weatherCondition.iconBaseUri
        ),
        maxCelsius: toRoundedCelsius(day.maxTemperature.degrees),
        minCelsius: toRoundedCelsius(day.minTemperature.degrees),
        precipitationPercent,
        precipitationLabel: `${precipitationPercent}\u00a0% nedbør`
      }
    })
  }
}
