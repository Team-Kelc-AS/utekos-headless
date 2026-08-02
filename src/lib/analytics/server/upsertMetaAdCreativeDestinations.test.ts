import assert from 'node:assert/strict'
import test from 'node:test'
import type { MetaAdCreativeDestination } from './metaAdCreativeDestination'
import { validateMetaAdCreativeDestinationSnapshot } from './upsertMetaAdCreativeDestinations'

function destination(
  overrides: Partial<MetaAdCreativeDestination> = {}
): MetaAdCreativeDestination {
  return {
    accountId: '772268237116474',
    adCreatedTime: '2026-07-01T00:00:00+0000',
    adId: '120246491016410788',
    adUpdatedTime: '2026-07-28T13:59:00+0000',
    creativeId: '2134034140490187',
    destinationFingerprint: 'a'.repeat(64),
    destinationUrl: 'https://utekos.no/skreddersy-varmen',
    dynamicResolutionStatus: 'static',
    effectiveStatus: 'CAMPAIGN_PAUSED',
    normalizedDestinationUrl:
      'https://utekos.no/skreddersy-varmen',
    observedVersion: 'b'.repeat(64),
    sourceKind: 'asset_feed_link_url',
    sourcePath: 'asset_feed_spec.link_urls[0].website_url',
    urlTags: null,
    ...overrides
  }
}

test('accepts one observed version with multiple destinations', () => {
  const result = validateMetaAdCreativeDestinationSnapshot({
    destinations: [
      destination(),
      destination({ destinationFingerprint: 'c'.repeat(64) })
    ],
    observedAt: new Date('2026-08-01T15:00:00.000Z')
  })

  assert.equal(result.accountId, '772268237116474')
  assert.equal(
    result.versionsByAd.get('120246491016410788'),
    'b'.repeat(64)
  )
})

test('rejects empty, cross-account and mixed-version snapshots', () => {
  const observedAt = new Date('2026-08-01T15:00:00.000Z')
  assert.throws(
    () =>
      validateMetaAdCreativeDestinationSnapshot({
        destinations: [],
        observedAt
      }),
    /empty/
  )
  assert.throws(
    () =>
      validateMetaAdCreativeDestinationSnapshot({
        destinations: [
          destination(),
          destination({ accountId: '123' })
        ],
        observedAt
      }),
    /multiple accounts/
  )
  assert.throws(
    () =>
      validateMetaAdCreativeDestinationSnapshot({
        destinations: [
          destination(),
          destination({ observedVersion: 'd'.repeat(64) })
        ],
        observedAt
      }),
    /multiple observed versions/
  )
})
