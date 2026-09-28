import assert from 'node:assert/strict'
import test from 'node:test'

import { cartQueryPolicy } from '@/lib/cart/cartQueryPolicy'

test('always revalidates the authoritative cart identity on window focus', () => {
  assert.equal(cartQueryPolicy.refetchOnWindowFocus, 'always')
})
