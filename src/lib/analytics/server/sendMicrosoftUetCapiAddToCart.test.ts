import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalAddToCartSchema } from '../addToCartEvent'
import {
  MicrosoftUetCapiConfigError,
  MicrosoftUetCapiHttpError
} from './sendMicrosoftUetCapiPurchase'
import { sendMicrosoftUetCapiAddToCart } from './sendMicrosoftUetCapiAddToCart'

function addToCart() {
  return canonicalAddToCartSchema.parse({
    schema_version: 1,
    event_name: 'add_to_cart',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_time: '2026-07-17T10:05:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/produkter/utekos-dun',
    page_title: 'Utekos Dun',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    click_id: {
      msclkid: 'dd4afccc-b1c9-4a4c-ad95-44dd7e5006ab'
    },
    custom_data: {
      currency: 'NOK',
      value: 100,
      gross_value: 100,
      tax_value: 20,
      cart_id: 'cart_1',
      cart_mutation_id: 'mutation_1',
      items: [
        {
          available_for_sale: true,
          collection_ids: [],
          collection_titles: [],
          currently_not_in_stock: false,
          gross_unit_price: 100,
          item_id: '1',
          item_name: 'Item',
          price_includes_tax: true,
          product_handle: 'item',
          product_id: 'gid://shopify/Product/1',
          quantity: 1,
          quantity_available: 1,
          selected_options: [],
          tax_amount: 20,
          tax_rate: 0.25,
          taxable: true,
          unit_price: 100,
          variant_id: 'gid://shopify/ProductVariant/1'
        }
      ]
    }
  })
}

test('posts add_to_cart events to the Microsoft UET CAPI endpoint', async () => {
  const calls: Array<{ body: string; url: string }> = []

  const result = await sendMicrosoftUetCapiAddToCart(addToCart(), {
    fetchFn: async (url, init) => {
      calls.push({
        body: String(init.body),
        url
      })

      return {
        headers: new Headers({ 'x-ms-request-id': 'req-atc-1' }),
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ eventsReceived: 1 })
      }
    },
    readConfig: () => ({
      apiToken: 'uet-token',
      tagId: '97247724'
    }),
    resolveToken: () => 'uet-token'
  })

  assert.equal(
    calls[0]?.url,
    'https://capi.uet.microsoft.com/v1/97247724/events'
  )
  assert.match(calls[0]?.body ?? '', /"eventName":"add_to_cart"/)
  assert.equal(result.status, 200)
  assert.equal(result.requestId, 'req-atc-1')
  assert.equal(result.eventName, 'add_to_cart')
  assert.equal(result.eventsReceived, 1)
  assert.equal(result.tagId, '97247724')
})

test('fails closed when the ApiToken is missing', async () => {
  await assert.rejects(
    () =>
      sendMicrosoftUetCapiAddToCart(addToCart(), {
        fetchFn: async () => {
          throw new Error('fetch should not run')
        },
        readConfig: () => ({ tagId: '97247724' }),
        resolveToken: () => undefined
      }),
    (error: unknown) =>
      error instanceof MicrosoftUetCapiConfigError
      && error.reason === 'missing_capi_token'
  )
})

test('surfaces non-2xx Microsoft responses as HTTP errors', async () => {
  await assert.rejects(
    () =>
      sendMicrosoftUetCapiAddToCart(addToCart(), {
        fetchFn: async () => ({
          headers: new Headers(),
          ok: false,
          status: 401,
          text: async () => '{"error":{"code":"Unauthorized"}}'
        }),
        readConfig: () => ({
          apiToken: 'bad-token',
          tagId: '97247724'
        }),
        resolveToken: () => 'bad-token'
      }),
    (error: unknown) =>
      error instanceof MicrosoftUetCapiHttpError
      && error.status === 401
  )
})
