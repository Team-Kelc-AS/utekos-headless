import assert from 'node:assert/strict'
import test from 'node:test'

import { getPinterestProductType } from './getPinterestProductType'

test('maps known Utekos product families to English product_type breadcrumbs', () => {
  assert.equal(
    getPinterestProductType('comfyrobe'),
    'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets'
  )
  assert.equal(
    getPinterestProductType('utekos-techdown'),
    'Apparel & Accessories > Clothing > Outerwear'
  )
  assert.throws(
    () => getPinterestProductType('ukjent-produkt'),
    /missing a product_type mapping/
  )
})
