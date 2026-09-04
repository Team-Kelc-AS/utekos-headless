import assert from 'node:assert/strict'
import test from 'node:test'

import {
  META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS,
  META_CATALOG_DEFAULT_TRACKING_URL_TAGS
} from './metaCatalogAdDefaults'

test('uses the product primary image tag as the catalog creative default', () => {
  assert.deepEqual(META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS, [
    'primary'
  ])
})

test('uses stable Meta object IDs in the default tracking template', () => {
  const tags = new URLSearchParams(
    META_CATALOG_DEFAULT_TRACKING_URL_TAGS
  )

  assert.equal(tags.get('utm_source'), 'meta')
  assert.equal(tags.get('utm_medium'), 'paid_social')
  assert.equal(tags.get('utm_campaign'), '{{campaign.id}}')
  assert.equal(tags.get('utm_id'), '{{campaign.id}}')
  assert.equal(tags.get('utm_term'), '{{adset.id}}')
  assert.equal(tags.get('utm_content'), '{{ad.id}}')
  assert.equal([...tags.keys()].length, 6)
})
