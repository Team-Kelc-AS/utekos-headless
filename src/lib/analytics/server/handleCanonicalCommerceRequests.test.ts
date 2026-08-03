import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalAddToCartSchema } from '../addToCartEvent'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import { CHECKOUT_METHOD_HEADER } from '../checkoutMethod'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { handleCanonicalAddToCartRequest } from './handleCanonicalAddToCartRequest'
import { handleCanonicalBeginCheckoutRequest } from './handleCanonicalBeginCheckoutRequest'

const eventEnvelope = {
  schema_version: 1,
  event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
  event_time: '2026-08-03T12:00:00.000Z',
  source: 'web',
  environment: 'test',
  page_url:
    'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
  page_title: 'Utekos TechDown',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  }
} as const

const commerceItem = {
  available_for_sale: true,
  collection_ids: [],
  collection_titles: [],
  currently_not_in_stock: false,
  gross_unit_price: 2499,
  item_id: 'techdown-black-m',
  item_name: 'Utekos TechDown',
  price_includes_tax: true,
  product_handle: 'utekos-techdown',
  product_id: 'gid://shopify/Product/1',
  quantity: 1,
  quantity_available: 10,
  selected_options: [{ name: 'Size', value: 'M' }],
  tax_amount: 499.8,
  tax_rate: 0.25,
  taxable: true,
  unit_price: 2499,
  variant_id: 'gid://shopify/ProductVariant/1'
} as const

const store: CanonicalEventStore = {
  accept: async () => ({
    createdDispatchAttempts: [],
    status: 'inserted'
  })
}

function commerceRequest(
  pathname: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Request(`https://utekos.no${pathname}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

test('accepted add_to_cart writes the structured runtime log', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) => {
    lines.push(String(value))
  })
  const event = canonicalAddToCartSchema.parse({
    ...eventEnvelope,
    event_name: 'add_to_cart',
    custom_data: {
      cart_id: 'gid://shopify/Cart/secret',
      cart_mutation_id: 'mutation-1',
      currency: 'NOK',
      gross_value: 2499,
      items: [commerceItem],
      tax_value: 499.8,
      value: 1999.2
    }
  })

  const response = await handleCanonicalAddToCartRequest(
    commerceRequest('/api/events/add-to-cart', event),
    { getRequestContext: () => ({}), store }
  )

  assert.equal(response.status, 202)
  const entry = JSON.parse(lines.at(-1) ?? '{}') as {
    context: Record<string, unknown>
    data: Record<string, unknown>
    event: string
  }
  assert.equal(entry.event, 'commerce.event')
  assert.equal(entry.data.eventName, 'add_to_cart')
  assert.equal(entry.context.pagePath, '/produkter/utekos-techdown')
  assert.equal(JSON.stringify(entry).includes('shopify/Cart'), false)
  assert.equal(JSON.stringify(entry).includes('fbclid'), false)
})

test('accepted Klarna begin_checkout writes the checkout method', async t => {
  const lines: string[] = []
  const acceptedEvents: CanonicalEventStoreInput['event'][] = []
  t.mock.method(console, 'log', (value: unknown) => {
    lines.push(String(value))
  })
  const event = canonicalBeginCheckoutSchema.parse({
    ...eventEnvelope,
    event_name: 'begin_checkout',
    custom_data: {
      cart_id: 'gid://shopify/Cart/secret',
      checkout_id: 'checkout-secret',
      creation_revision: 'revision-secret',
      currency: 'NOK',
      gross_value: 2499,
      items: [commerceItem],
      tax_value: 499.8,
      value: 1999.2
    }
  })

  const response = await handleCanonicalBeginCheckoutRequest(
    commerceRequest('/api/events/begin-checkout', event, {
      [CHECKOUT_METHOD_HEADER]: 'klarna_express'
    }),
    {
      getRequestContext: () => ({}),
      store: {
        accept: async input => {
          acceptedEvents.push(input.event)
          return {
            createdDispatchAttempts: [],
            status: 'inserted'
          }
        }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.equal(
    acceptedEvents[0]?.event_name === 'begin_checkout' ?
      acceptedEvents[0].checkout_method
    : undefined,
    'klarna_express'
  )
  const entry = JSON.parse(lines.at(-1) ?? '{}') as {
    data: Record<string, unknown>
    event: string
  }
  assert.equal(entry.event, 'commerce.event')
  assert.equal(entry.data.eventName, 'begin_checkout')
  assert.equal(entry.data.checkoutMethod, 'klarna_express')
  assert.equal(JSON.stringify(entry).includes('checkout-secret'), false)
})

test('begin_checkout persists the server-validated default method', async t => {
  const acceptedEvents: CanonicalEventStoreInput['event'][] = []
  t.mock.method(console, 'log', () => {})
  const event = canonicalBeginCheckoutSchema.parse({
    ...eventEnvelope,
    checkout_method: 'klarna_express',
    event_name: 'begin_checkout',
    custom_data: {
      cart_id: 'gid://shopify/Cart/secret',
      checkout_id: 'checkout-secret',
      creation_revision: 'revision-secret',
      currency: 'NOK',
      gross_value: 2499,
      items: [commerceItem],
      tax_value: 499.8,
      value: 1999.2
    }
  })

  const response = await handleCanonicalBeginCheckoutRequest(
    commerceRequest('/api/events/begin-checkout', event),
    {
      getRequestContext: () => ({}),
      store: {
        accept: async input => {
          acceptedEvents.push(input.event)
          return {
            createdDispatchAttempts: [],
            status: 'inserted'
          }
        }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.equal(
    acceptedEvents[0]?.event_name === 'begin_checkout' ?
      acceptedEvents[0].checkout_method
    : undefined,
    'shopify_checkout'
  )
})
