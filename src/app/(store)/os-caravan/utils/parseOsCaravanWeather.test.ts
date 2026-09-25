import assert from 'node:assert/strict'
import test from 'node:test'
import { parseOsCaravanWeather } from './parseOsCaravanWeather'

const currentPayload = {
  temperature: { degrees: 11.9, unit: 'CELSIUS' },
  feelsLikeTemperature: { degrees: 10, unit: 'CELSIUS' },
  weatherCondition: {
    iconBaseUri: 'https://maps.gstatic.com/weather/v1/cloudy',
    description: { text: 'Overskyet', languageCode: 'no' }
  }
}

const forecastPayload = {
  forecastDays: [
    {
      displayDate: { year: 2026, month: 9, day: 25 },
      maxTemperature: { degrees: 12.3 },
      minTemperature: { degrees: 8.4 },
      daytimeForecast: {
        weatherCondition: {
          iconBaseUri: 'https://maps.gstatic.com/weather/v1/rain',
          description: { text: 'Regn' }
        },
        precipitation: { probability: { percent: 80 } }
      }
    },
    {
      displayDate: { year: 2026, month: 9, day: 26 },
      maxTemperature: { degrees: 14.1 },
      minTemperature: { degrees: 7.6 },
      daytimeForecast: {
        weatherCondition: {
          iconBaseUri: 'https://maps.gstatic.com/weather/v1/partly_cloudy',
          description: { text: 'Delvis skyet' }
        }
      }
    }
  ]
}

test('normalizes current conditions and a five-day forecast for the visit section', () => {
  const weather = parseOsCaravanWeather(currentPayload, forecastPayload)

  assert.equal(weather.source, 'google')
  assert.equal(weather.attribution, '')
  assert.deepEqual(weather.current, {
    celsius: 12,
    feelsLikeCelsius: 10,
    description: 'Overskyet',
    iconSrc: 'https://maps.gstatic.com/weather/v1/cloudy_dark.svg'
  })
  assert.equal(weather.days[0]?.label, 'I dag')
  assert.equal(weather.days[0]?.maxCelsius, 12)
  assert.equal(weather.days[0]?.minCelsius, 8)
  assert.equal(weather.days[0]?.precipitationPercent, 80)
  assert.equal(weather.days[0]?.precipitationLabel, '80\u00a0% nedbør')
  assert.equal(
    weather.days[0]?.iconSrc,
    'https://maps.gstatic.com/weather/v1/rain_dark.svg'
  )
  assert.equal(weather.days[1]?.precipitationPercent, 0)
  assert.match(weather.days[1]?.label ?? '', /[A-Za-zæøåÆØÅ]/)
})
