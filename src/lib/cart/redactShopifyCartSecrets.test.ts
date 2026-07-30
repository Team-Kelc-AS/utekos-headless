import assert from 'node:assert/strict'
import test from 'node:test'

import { redactShopifyCartSecrets } from './redactShopifyCartSecrets'

test('redacts Shopify secret query values in provider messages', () => {
  const fullId =
    'gid://shopify/Cart/token?key=never-log-this&other=value'

  assert.equal(
    redactShopifyCartSecrets(`Cart ${fullId} failed`),
    'Cart [SHOPIFY_CART_ID_REDACTED] failed'
  )
})
