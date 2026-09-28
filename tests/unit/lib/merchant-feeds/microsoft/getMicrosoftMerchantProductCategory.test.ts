import assert from 'node:assert/strict'
import test from 'node:test'

import { getMicrosoftMerchantProductCategory } from '@/lib/merchant-feeds/microsoft/getMicrosoftMerchantProductCategory'

test('maps known Utekos product families to Bing taxonomy IDs', () => {
  assert.equal(getMicrosoftMerchantProductCategory('comfyrobe'), '5598')
  assert.equal(
    getMicrosoftMerchantProductCategory('utekos-stapper'),
    '5636'
  )
  assert.equal(
    getMicrosoftMerchantProductCategory('utekos-techdown'),
    '203'
  )
  assert.throws(
    () => getMicrosoftMerchantProductCategory('new-unmapped-product'),
    /missing a Bing category mapping/
  )
})
