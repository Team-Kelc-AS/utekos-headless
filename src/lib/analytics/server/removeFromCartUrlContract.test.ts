import assert from 'node:assert/strict'
import test from 'node:test'
import { createCanonicalRemoveFromCart } from '../removeFromCartEvent'
import { shopifyCartRemovalToCanonicalRemoveFromCart } from './shopifyCartRemovalToCanonicalRemoveFromCart'
import { mapCanonicalRemoveFromCartToMeta } from './mapCanonicalRemoveFromCartToMeta'
import { mapCanonicalRemoveFromCartToGoogleDataManager } from './mapCanonicalRemoveFromCartToGoogleDataManager'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import { acceptCanonicalRemoveFromCart } from './acceptCanonicalRemoveFromCart'
import { mapCanonicalEventPersistence } from './mapCanonicalEventPersistence'

async function removal() {
  const event =
    await shopifyCartRemovalToCanonicalRemoveFromCart({
      cartToken: 'test-cart',
      quantityRemoved: 1,
      updatedAt: '2026-09-08T12:00:00.000Z',
      priorLine: {
        price: '1590.00',
        product_id: '456',
        variant_id: '123',
        quantity: 2,
        title: 'TechDown',
        currency_code: 'NOK',
        taxable: true
      }
    })
  return {
    ...event,
    browser_id: { ga_client_id: '123456789.1784201643' },
    consent: {
      ...event.consent,
      analytics: 'granted' as const,
      marketing: 'granted' as const
    }
  }
}

test('browser constructor rejects a missing URL rather than inventing the homepage', async () => {
  const event = await removal()
  assert.throws(
    () =>
      createCanonicalRemoveFromCart({
        environment: 'test',
        eventId: event.event_id,
        eventTime: event.event_time,
        customData: event.custom_data,
        consent: event.consent,
        pageTitle: 'TechDown',
        pageUrl: undefined as unknown as string
      }),
    /page_url/
  )
})

test('Meta refuses a URL-less webhook; Google omits page_location', async () => {
  const event = await removal()
  assert.equal(event.page_url, undefined)
  assert.throws(
    () => mapCanonicalRemoveFromCartToMeta(event),
    /missing_page_url/
  )
  const google =
    mapCanonicalRemoveFromCartToGoogleDataManager(event)
  assert.equal(
    google.additionalEventParameters?.some(
      p => p.parameterName === 'page_location'
    ),
    false
  )
})

test('URL-less webhook remains accepted internally with an explicit Meta skip', async () => {
  const event = await removal()
  const meta = planCanonicalEventDispatch(event).find(
    d => d.provider === 'meta'
  )
  assert.equal(
    meta && 'skip_reason' in meta ? meta.skip_reason : undefined,
    'missing_page_url'
  )
  let accepted = false
  const result = await acceptCanonicalRemoveFromCart({
    payload: event,
    requestContext: {},
    store: {
      accept: async input => {
        assert.equal(input.event.page_url, undefined)
        assert.ok(
          input.dispatches.some(
            d =>
              d.provider === 'meta' &&
              'status' in d &&
              d.status === 'skipped_unqualified'
          )
        )
        const rows = mapCanonicalEventPersistence(input)
        assert.equal(rows.ledger.source_url, undefined)
        assert.equal(
          rows.dispatches.find(d => d.provider === 'meta')
            ?.skip_reason,
          'missing_page_url'
        )
        accepted = true
        return {
          status: 'inserted',
          createdDispatchAttempts: []
        }
      }
    }
  })
  assert.equal(accepted, true)
  assert.equal(result.status, 'accepted')
})

test('Meta preserves an observed landing URL', async () => {
  const event = {
    ...(await removal()),
    page_url: 'https://utekos.no/skreddersy-varmen'
  }
  const mapped =
    mapCanonicalRemoveFromCartToMeta(event).normalize()
  assert.equal(
    mapped.event_source_url,
    'https://utekos.no/skreddersy-varmen.AQQCAQMB'
  )
})
