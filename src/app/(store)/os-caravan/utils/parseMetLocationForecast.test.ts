import assert from 'node:assert/strict'
import test from 'node:test'
import {
  describeMetSymbol,
  parseMetLocationForecast
} from './parseMetLocationForecast'

function point(
  time: string,
  temperature: number,
  options?: {
    symbol1h?: string
    symbol6h?: string
    precipitation1h?: number
  }
) {
  return {
    time,
    data: {
      instant: {
        details: {
          air_temperature: temperature
        }
      },
      ...(options?.symbol1h || options?.precipitation1h != null ?
        {
          next_1_hours: {
            summary: options.symbol1h
              ? { symbol_code: options.symbol1h }
              : undefined,
            details:
              options.precipitation1h != null
                ? { precipitation_amount: options.precipitation1h }
                : undefined
          }
        }
      : {}),
      ...(options?.symbol6h ?
        {
          next_6_hours: {
            summary: { symbol_code: options.symbol6h }
          }
        }
      : {})
    }
  }
}

test('maps MET symbol codes to Norwegian labels', () => {
  assert.equal(describeMetSymbol('cloudy'), 'Overskyet')
  assert.equal(describeMetSymbol('heavyrain_day'), 'Kraftig regn')
  assert.equal(describeMetSymbol('partlycloudy_night'), 'Delvis skyet')
  assert.equal(describeMetSymbol('rainandthunder'), 'Torden')
})

test('groups compact timeseries into current conditions and Oslo days', () => {
  const weather = parseMetLocationForecast({
    properties: {
      timeseries: [
        point('2026-09-25T08:00:00Z', 11.8, {
          symbol1h: 'cloudy',
          precipitation1h: 0.2
        }),
        point('2026-09-25T11:00:00Z', 12.4, {
          symbol6h: 'heavyrain',
          precipitation1h: 4.9
        }),
        point('2026-09-26T08:00:00Z', 7.6, {
          symbol1h: 'fair',
          precipitation1h: 0
        }),
        point('2026-09-26T12:00:00Z', 13.2, {
          symbol6h: 'partlycloudy_day',
          precipitation1h: 0
        })
      ]
    }
  })

  assert.equal(weather.source, 'met')
  assert.equal(
    weather.attribution,
    'Værvarsel fra Meteorologisk institutt'
  )
  assert.equal(weather.current.celsius, 12)
  assert.equal(weather.current.description, 'Overskyet')
  assert.equal(weather.days.length, 2)
  assert.equal(weather.days[0]?.label, 'I dag')
  assert.equal(weather.days[0]?.description, 'Kraftig regn')
  assert.equal(weather.days[0]?.maxCelsius, 12)
  assert.equal(weather.days[0]?.minCelsius, 12)
  assert.equal(weather.days[0]?.precipitationLabel, '5.1\u00a0mm')
  assert.equal(weather.days[1]?.description, 'Delvis skyet')
  assert.equal(weather.days[1]?.precipitationLabel, 'Opphold')
})
