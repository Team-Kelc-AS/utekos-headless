import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildVippsPaymentRequest,
  vippsCheckoutInputSchema
} from '@/lib/vipps/createCheckout'
import { vippsPaymentDescription } from '@/lib/vipps/productDescription'

test('Widget SDK receives a stable product checkout input', () => {
  const input = {
    handle: 'utekos-stapper',
    variantId: 'gid://shopify/ProductVariant/42903954292984',
    attemptId: '6a8ff84d-d1d9-4784-a36c-0bd7290866c9'
  }

  assert.deepEqual(vippsCheckoutInputSchema.parse(input), input)
})

test('approved first-party discount flows remain supported server-side', () => {
  const input = vippsCheckoutInputSchema.parse({
    handle: 'utekos-stapper',
    variantId: 'gid://shopify/ProductVariant/42903954292984',
    attemptId: '6a8ff84d-d1d9-4784-a36c-0bd7290866c9',
    discountCode: ' kristoffertesTrabatt '
  })

  assert.equal(input.discountCode, 'KRISTOFFERTESTRABATT')
})

test('Vipps receives the verified Shopify product, color and size', () => {
  assert.equal(
    vippsPaymentDescription(' Utekos TechDown™ ', [
      { name: 'Kjønn', value: 'Unisex' },
      { name: 'Størrelse', value: ' Middels ' },
      { name: 'Farge', value: ' Havdyp ' }
    ]),
    'Utekos TechDown™ Havdyp, Middels'
  )
  assert.equal(
    vippsPaymentDescription('Utekos Stapper™', [
      { name: 'Title', value: 'Default Title' }
    ]),
    'Utekos Stapper™'
  )
})

test('payment request keeps amount and shipping boundaries while naming the item', () => {
  const request = buildVippsPaymentRequest({
    reference: 'utekos-express-fixture',
    amount: 208900,
    shippingAmount: 9900,
    productTitle: 'Utekos TechDown™',
    selectedOptions: [
      { name: 'Color', value: 'Havdyp' },
      { name: 'Size', value: 'Stor' },
      { name: 'Gender', value: 'Unisex' }
    ],
    origin: 'https://utekos.no',
    token: 'fixture-token'
  })

  assert.equal(
    request.paymentDescription,
    'Utekos TechDown™ Havdyp, Stor'
  )
  assert.deepEqual(request.amount, {
    currency: 'NOK',
    value: 199000
  })
  assert.equal(
    request.shipping.fixedOptions[0]?.options[0]?.amount.value,
    9900
  )
})
