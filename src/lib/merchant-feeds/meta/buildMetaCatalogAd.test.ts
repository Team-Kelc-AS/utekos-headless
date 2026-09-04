import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaCatalogAd } from './buildMetaCatalogAd'

const input = {
  adName: 'UTEKOS | Advantage+ Catalog | v26',
  adSetId: '120247531435510788',
  instagramUserId: '17841409220835205',
  link: 'https://utekos.no/produkter/utekos-techdown',
  message: 'Skreddersy varmen med Utekos TechDown™.',
  pageId: '101843722195040',
  pixelId: '1092362672918571',
  productSetId: '2063661761231205'
}

test('builds a paused v26 Advantage+ catalog ad with preferred image tags', () => {
  const request = buildMetaCatalogAd(input)

  assert.equal(request.status, 'PAUSED')
  assert.equal(request.adset_id, input.adSetId)
  assert.equal(request.conversion_domain, 'utekos.no')
  assert.equal(request.creative.product_set_id, input.productSetId)
  assert.deepEqual(
    request.creative.object_story_spec.template_data
      .preferred_image_tags,
    [
      '{"DEFAULT":"primary","4_5":"ASPECT_RATIO_4_5_PREFERRED","9_16":"ASPECT_RATIO_9_16_PREFERRED"}'
    ]
  )
  assert.equal(
    'preferred_image_tags' in request.creative,
    false
  )
  assert.deepEqual(request.creative.asset_feed_spec, {
    ad_formats: ['CAROUSEL', 'COLLECTION'],
    descriptions: [{ text: '{{product.description}}' }],
    optimization_type: 'FORMAT_AUTOMATION'
  })
  assert.deepEqual(
    request.creative.degrees_of_freedom_spec,
    {
      creative_features_spec: {
        adapt_to_placement: { enroll_status: 'OPT_IN' },
        media_type_automation: { enroll_status: 'OPT_OUT' }
      }
    }
  )
  assert.deepEqual(request.tracking_specs, [
    {
      'action.type': 'offsite_conversion',
      fb_pixel: input.pixelId
    }
  ])
})

test('opts into catalog product videos only when explicitly requested', () => {
  const request = buildMetaCatalogAd({
    ...input,
    includeProductVideo: true
  })

  assert.equal(
    request.creative.degrees_of_freedom_spec
      .creative_features_spec.media_type_automation.enroll_status,
    'OPT_IN'
  )
})

test('rejects Shopify and non-canonical landing page origins', () => {
  for (const link of [
    'https://kasse.utekos.no/products/utekos-techdown',
    'https://example.com/utekos-techdown',
    'http://utekos.no/produkter/utekos-techdown'
  ]) {
    assert.throws(
      () => buildMetaCatalogAd({ ...input, link }),
      /canonical public Utekos origin/
    )
  }
})
