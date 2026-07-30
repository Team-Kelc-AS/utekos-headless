import assert from 'node:assert/strict'
import test from 'node:test'

import { adoptAuthoritativeCartIdentity } from './adoptAuthoritativeCartIdentity'
import type { Cart } from 'types/cart'

test('adopts B in client state before caching B and removing stale A', () => {
  const calls: string[] = []
  const cart = { id: 'gid://shopify/Cart/B' } as Cart

  adoptAuthoritativeCartIdentity(cart.id, cart, {
    setCartId: cartId => calls.push(`state:${cartId}`),
    setCartCache: (cartId, value) =>
      calls.push(`cache:${cartId}:${value.id}`),
    removeOtherCartCaches: cartId =>
      calls.push(`remove-except:${cartId}`)
  })

  assert.deepEqual(calls, [
    'state:gid://shopify/Cart/B',
    'cache:gid://shopify/Cart/B:gid://shopify/Cart/B',
    'remove-except:gid://shopify/Cart/B'
  ])
})

test('adopts a rotated identity before refetch without caching B under A', () => {
  const calls: string[] = []

  adoptAuthoritativeCartIdentity('gid://shopify/Cart/B', null, {
    setCartId: cartId => calls.push(`state:${cartId}`),
    setCartCache: () => calls.push('unexpected-cache-write'),
    removeOtherCartCaches: cartId =>
      calls.push(`remove-except:${cartId}`)
  })

  assert.deepEqual(calls, [
    'state:gid://shopify/Cart/B',
    'remove-except:gid://shopify/Cart/B'
  ])
})
