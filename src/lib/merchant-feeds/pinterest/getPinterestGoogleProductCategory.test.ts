import assert from 'node:assert/strict'
import test from 'node:test'

import { getPinterestGoogleProductCategory } from './getPinterestGoogleProductCategory'

test('maps known Utekos product families to Google taxonomy IDs', () => {
  assert.equal(
    getPinterestGoogleProductCategory('comfyrobe'),
    '187'
  )
  assert.equal(
    getPinterestGoogleProductCategory('utekos-stapper'),
    '1013'
  )
  assert.equal(
    getPinterestGoogleProductCategory('utekos-techdown'),
    '203'
  )
  assert.throws(
    () =>
      getPinterestGoogleProductCategory('new-unmapped-product'),
    /missing a Google product category mapping/
  )
})
