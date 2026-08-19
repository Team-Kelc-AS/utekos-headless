import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAppLogEntryExtras } from './appLogEntryExtrasSchema'

test('accepts PII-free ad-platform event parameters', () => {
  const extras = parseAppLogEntryExtras({
    eventId: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    eventName: 'add_to_cart',
    pageUrl: 'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
    adPlatformEvents: {
      meta: {
        eventName: 'AddToCart',
        requiredParameters: ['event_id', 'user_data', 'currency'],
        transport: {
          browser: null,
          server: 'meta_conversions_api'
        },
        parameters: {
          action_source: 'website',
          currency: 'NOK',
          event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
          event_source_url:
            'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
          value: 2499
        }
      }
    }
  })

  assert.equal(extras.pageUrl, '/produkter/utekos-techdown')
  assert.equal(
    extras.adPlatformEvents?.meta?.parameters.event_source_url,
    '/produkter/utekos-techdown'
  )
  assert.equal(
    JSON.stringify(extras).includes('secret'),
    false
  )
})

test('rejects customer identifiers in ad-platform parameters', () => {
  assert.equal(
    (() => {
      try {
        parseAppLogEntryExtras({
          adPlatformEvents: {
            meta: {
              eventName: 'AddToCart',
              requiredParameters: ['user_data'],
              transport: {
                browser: null,
                server: 'meta_conversions_api'
              },
              parameters: {
                user_data: { em: ['abc'] }
              }
            }
          }
        })
        return true
      } catch {
        return false
      }
    })(),
    false
  )
})
