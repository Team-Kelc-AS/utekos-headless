import assert from 'node:assert/strict'
import test from 'node:test'

import {
  META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS,
  META_CATALOG_DEFAULT_TRACKING_URL_TAGS
} from './metaCatalogAdDefaults'

test('maps each catalog placement ratio to its preferred image tag', () => {
  assert.deepEqual(META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS, [
    '{"DEFAULT":"primary","4_5":"ASPECT_RATIO_4_5_PREFERRED","9_16":"ASPECT_RATIO_9_16_PREFERRED"}'
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
  assert.equal(tags.get('campaign_id'), '{{campaign.id}}')
  assert.equal(tags.get('adset_id'), '{{adset.id}}')
  assert.equal(tags.get('ad_id'), '{{ad.id}}')
  assert.equal(tags.get('placement'), '{{placement}}')
  assert.equal(tags.get('site_source_name'), '{{site_source_name}}')
  assert.equal([...tags.keys()].length, 11)
})
