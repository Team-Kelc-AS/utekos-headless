import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import {
  canonicalPurchaseSchema,
  deterministicPurchaseEventId
} from '../purchaseEvent'
import { linkCanonicalPurchaseJourney } from './linkCanonicalPurchaseJourney'
import { normalizeCanonicalPurchase } from './normalizeCanonicalPurchase'
import { stripInternalJourneyContext } from '../internalJourneyContext'

const journeyId = '11111111-1111-4111-8111-111111111111'
const pageViewId = '22222222-2222-4222-8222-222222222222'
const checkoutId = '33333333-3333-4333-8333-333333333333'
const consent = {
  analytics: 'granted' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}
const purchase = canonicalPurchaseSchema.parse({
  schema_version: 1,
  event_name: 'purchase',
  event_id: deterministicPurchaseEventId('100'),
  event_time: '2026-09-06T10:05:00.000Z',
  source: 'webhook',
  environment: 'test',
  consent,
  begin_checkout_event_id: checkoutId,
  custom_data: {
    currency: 'NOK',
    value: 100,
    transaction_id: 'shopify_order_100',
    order_name: '#100',
    items: [
      {
        item_id: '1',
        item_name: 'Utekos',
        quantity: 1,
        unit_price: 100
      }
    ]
  }
})
const begin = canonicalBeginCheckoutSchema.parse({
  schema_version: 1,
  event_name: 'begin_checkout',
  event_id: checkoutId,
  event_time: '2026-09-06T10:00:00.000Z',
  source: 'web',
  environment: 'test',
  consent,
  journey_id: journeyId,
  page_view_id: pageViewId,
  page_url: 'https://utekos.no/skreddersy-varmen',
  page_title: 'Utekos',
  custom_data: {
    currency: 'NOK',
    value: 100,
    gross_value: 100,
    tax_value: 20,
    cart_id: 'cart',
    checkout_id: 'checkout',
    creation_revision: '1',
    items: [
      {
        item_id: '1',
        product_id: '1',
        variant_id: '1',
        product_handle: 'utekos',
        item_name: 'Utekos',
        quantity: 1,
        unit_price: 100,
        gross_unit_price: 100,
        tax_amount: 20,
        tax_rate: 0.25,
        taxable: true,
        price_includes_tax: true,
        available_for_sale: true,
        currently_not_in_stock: false,
        quantity_available: 1,
        selected_options: [],
        collection_ids: [],
        collection_titles: []
      }
    ]
  }
})

test('links only the exact consented begin_checkout source, independently of marketing', async () => {
  const lookups: Array<{
    event_id: string
    event_name: string
  }> = []
  const event = await linkCanonicalPurchaseJourney(purchase, {
    async find(input) {
      lookups.push(input)
      return input.event_name === 'begin_checkout' ? begin : null
    }
  })
  assert.equal(event.journey_id, journeyId)
  assert.equal(event.page_view_id, pageViewId)
  assert.equal(event.journey_link_reason, 'linked')
  assert.deepEqual(lookups[1], {
    event_id: checkoutId,
    event_name: 'begin_checkout'
  })
  const providerEvent = stripInternalJourneyContext(event)
  assert.equal(providerEvent.journey_id, undefined)
  assert.equal(providerEvent.begin_checkout_event_id, undefined)
  assert.equal(providerEvent.journey_link_reason, undefined)
})

test('does not look up or accept caller supplied journey when analytics is denied', async () => {
  const event = normalizeCanonicalPurchase(
    {
      ...purchase,
      consent: {
        ...consent,
        analytics: 'denied',
        marketing: 'granted'
      },
      journey_id: journeyId,
      page_view_id: pageViewId,
      journey_link_reason: 'linked'
    },
    {}
  )
  const result = await linkCanonicalPurchaseJourney(event, {
    async find() {
      assert.fail('denied consent must not query a journey')
    }
  })
  assert.equal(result.journey_id, undefined)
  assert.equal(result.page_view_id, undefined)
  assert.equal(result.begin_checkout_event_id, undefined)
  assert.equal(
    result.journey_link_reason,
    'analytics_consent_not_granted'
  )
})

test('reports missing, mismatched and unavailable linkage without losing the paid event', async () => {
  const cases = [
    [null, 'begin_checkout_not_found'],
    [
      { ...begin, environment: 'production' },
      'begin_checkout_mismatch'
    ],
    [
      { ...begin, event_id: journeyId },
      'begin_checkout_mismatch'
    ],
    [
      { ...begin, consent: { ...consent, analytics: 'denied' } },
      'begin_checkout_mismatch'
    ],
    [
      { ...begin, event_time: '2026-09-04T10:00:00.000Z' },
      'begin_checkout_mismatch'
    ],
    [
      { ...begin, journey_id: undefined },
      'begin_checkout_journey_missing'
    ]
  ] as const
  for (const [source, reason] of cases) {
    const event = await linkCanonicalPurchaseJourney(purchase, {
      async find(input) {
        return input.event_name === 'begin_checkout' ?
            (source as typeof begin)
          : null
      }
    })
    assert.equal(event.journey_link_reason, reason)
    assert.equal(event.event_id, purchase.event_id)
    assert.equal(event.journey_id, undefined)
  }
  const unavailable = await linkCanonicalPurchaseJourney(
    purchase,
    {
      async find() {
        throw new Error('database unavailable')
      }
    }
  )
  assert.equal(
    unavailable.journey_link_reason,
    'lookup_unavailable'
  )
})

test('retry retains the stored linkage result even if the checkout source arrives later', async () => {
  const stored = {
    ...purchase,
    journey_link_reason: 'begin_checkout_not_found' as const
  }
  const event = await linkCanonicalPurchaseJourney(purchase, {
    async find(input) {
      assert.equal(input.event_name, 'purchase')
      return stored
    }
  })
  assert.deepEqual(event, stored)
})

test('retry does not replace incoming commerce fields with the previous payload', async () => {
  const changed = {
    ...purchase,
    custom_data: { ...purchase.custom_data, value: 200 }
  }
  const event = await linkCanonicalPurchaseJourney(changed, {
    async find() {
      return {
        ...purchase,
        journey_id: journeyId,
        page_view_id: pageViewId,
        journey_link_reason: 'linked'
      }
    }
  })
  assert.equal(event.custom_data.value, 200)
  assert.equal(event.journey_id, journeyId)
})
