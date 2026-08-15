import assert from 'node:assert/strict'
import test from 'node:test'

import { getKlarnaFeedCategory } from './getKlarnaFeedCategory'

const categories = new Map([
  ['comfyrobe', 'Klær > Unisex > Yttertøy > Jakker og kåper'],
  ['utekos-dun', 'Klær > Unisex > Yttertøy'],
  ['utekos-mikrofiber', 'Klær > Unisex > Yttertøy'],
  ['utekos-techdown', 'Klær > Unisex > Yttertøy'],
  [
    'utekos-stapper',
    'Sport og fritid > Friluftsliv > Oppbevaring > Kompresjonsposer'
  ]
])

test('uses explicit granular Klarna category breadcrumbs', () => {
  for (const [handle, category] of categories) {
    assert.equal(getKlarnaFeedCategory(handle), category)
  }
})

test('fails closed instead of deriving a category from arbitrary product data', () => {
  assert.throws(
    () => getKlarnaFeedCategory('ukjent-produkt'),
    /missing a category mapping/
  )
})
