import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveBootstrappedCartId } from './resolveBootstrappedCartId'

test('hydrates an absent cart id from the persisted cookie', () => {
  assert.equal(
    resolveBootstrappedCartId(
      null,
      'gid://shopify/Cart/persisted'
    ),
    'gid://shopify/Cart/persisted'
  )
})

test('does not overwrite a cart created before bootstrap completes', () => {
  assert.equal(
    resolveBootstrappedCartId(
      'gid://shopify/Cart/created-by-mutation',
      'gid://shopify/Cart/stale-cookie'
    ),
    'gid://shopify/Cart/created-by-mutation'
  )
})

test('keeps an empty cart state when no cookie exists', () => {
  assert.equal(resolveBootstrappedCartId(null, null), null)
})
