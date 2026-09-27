import assert from 'node:assert/strict'
import { test } from 'node:test'
import { vippsCheckoutInputSchema } from './createCheckout'

test('Widget SDK can create a checkout without a merchant confirmation modal', () => {
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
