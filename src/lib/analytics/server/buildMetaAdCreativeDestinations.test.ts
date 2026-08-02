import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMetaAdCreativeDestinations } from './buildMetaAdCreativeDestinations'

const ad = {
  created_time: '2026-07-01T00:00:00+0000',
  creative: { id: '2134034140490187' },
  effective_status: 'CAMPAIGN_PAUSED',
  id: '120246491016410788',
  updated_time: '2026-07-28T13:59:00+0000'
}

test('extracts static and template creative destinations with stable hashes', () => {
  const input = {
    accountId: '772268237116474',
    ad,
    creative: {
      asset_feed_spec: {
        link_urls: [
          {
            website_url:
              'https://utekos.no/skreddersy-varmen#hero'
          }
        ]
      },
      id: '2134034140490187',
      template_url_spec: {
        web: { url: 'https://utekos.no/products/{{product.id}}' }
      },
      url_tags: 'hsa_ad=120246491016410788'
    }
  }

  const first = buildMetaAdCreativeDestinations(input)
  const second = buildMetaAdCreativeDestinations(input)

  assert.deepEqual(first, second)
  assert.equal(first.length, 2)
  assert.equal(
    first[0]?.normalizedDestinationUrl,
    'https://utekos.no/skreddersy-varmen'
  )
  assert.equal(first[0]?.dynamicResolutionStatus, 'static')
  assert.equal(first[1]?.dynamicResolutionStatus, 'template')
  assert.equal(first[0]?.destinationFingerprint.length, 64)
  assert.equal(first[0]?.observedVersion.length, 64)
})

test('records catalog and unresolved creatives instead of dropping ads', () => {
  const catalog = buildMetaAdCreativeDestinations({
    accountId: '772268237116474',
    ad,
    creative: {
      id: '2134034140490187',
      product_set_id: '123456'
    }
  })
  const unresolved = buildMetaAdCreativeDestinations({
    accountId: '772268237116474',
    ad,
    creative: { id: '2134034140490187' }
  })

  assert.equal(catalog[0]?.sourceKind, 'catalog_product_set')
  assert.equal(catalog[0]?.destinationUrl, null)
  assert.equal(unresolved[0]?.sourceKind, 'unresolved')
})

test('preserves non-HTTP app destinations as explicit deeplinks', () => {
  const destinations = buildMetaAdCreativeDestinations({
    accountId: '772268237116474',
    ad,
    creative: {
      id: '2134034140490187',
      object_story_spec: {
        video_data: {
          call_to_action: {
            value: { link: 'utekos://product/techdown' }
          }
        }
      }
    }
  })

  assert.equal(
    destinations[0]?.dynamicResolutionStatus,
    'deeplink'
  )
  assert.equal(
    destinations[0]?.normalizedDestinationUrl,
    'utekos://product/techdown'
  )
})

test('rejects a creative that does not belong to the requested ad', () => {
  assert.throws(
    () =>
      buildMetaAdCreativeDestinations({
        accountId: '772268237116474',
        ad,
        creative: { id: '999999999999' }
      }),
    /unexpected creative/
  )
})
