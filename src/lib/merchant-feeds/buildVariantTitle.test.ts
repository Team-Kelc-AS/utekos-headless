import assert from 'node:assert/strict'
import test from 'node:test'

import { buildVariantTitle } from './buildVariantTitle'

test('builds a readable title from product, color and size only', () => {
  assert.equal(
    buildVariantTitle('Utekos TechDown™', [
      { name: 'Farge', value: 'Havdyp' },
      { name: 'Størrelse', value: 'Liten' },
      { name: 'Kjønn', value: 'Unisex' }
    ]),
    'Utekos TechDown™ Havdyp – Liten'
  )
})

test('falls back safely when a product has no color or size option', () => {
  assert.equal(
    buildVariantTitle('Comfyrobe™', [
      { name: 'Kjønn', value: 'Unisex' }
    ]),
    'Comfyrobe™'
  )
})
