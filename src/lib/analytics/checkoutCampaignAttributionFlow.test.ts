import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveCampaignAttribution } from './campaignAttributionSessionStore'
import {
  checkoutAttributionSnapshotToShopifyAttributes,
  createCheckoutAttributionSnapshot
} from './checkoutAttributionSnapshot'

function createMemoryStorage() {
  const store = new Map<string, string>()

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    }
  }
}

test('writes HubSpot Facebook ad set id onto Shopify cart attributes', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-08-21T12:00:00.000Z')

  resolveCampaignAttribution(
    'https://utekos.no/skreddersy-varmen?utm_campaign=New+Sales+Campaign&hsa_cam=120246869534650788&hsa_grp=120246869534640788&hsa_ad=120246935997000788',
    session,
    local,
    now
  )
  const campaign = resolveCampaignAttribution(
    'https://utekos.no/handlehjelp/storrelsesguide',
    session,
    local,
    now
  )
  const snapshot = createCheckoutAttributionSnapshot(
    {
      campaign,
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'granted',
        source: 'cookiebot',
        version: '1'
      },
      page_url: 'https://utekos.no/handlehjelp/storrelsesguide'
    },
    '2026-08-21T12:00:00.000Z'
  )
  const attributes = Object.fromEntries(
    checkoutAttributionSnapshotToShopifyAttributes(snapshot).map(
      attribute => [attribute.key, attribute.value]
    )
  )

  assert.equal(attributes.utekos_adset_id, '120246869534640788')
  assert.equal(attributes.utekos_campaign_id, '120246869534650788')
  assert.equal(attributes.utekos_ad_id, '120246935997000788')
})

test('carries landing campaign hierarchy through navigation into Shopify attributes', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-08-21T12:00:00.000Z')

  resolveCampaignAttribution(
    'https://utekos.no/produkter/comfyrobe?utm_campaign=Comfyrobe%20Sales&campaign_id=1201&adset_name=Prospektering&adset_id=1202&ad_name=Video%20A&ad_id=1203',
    session,
    local,
    now
  )
  const campaign = resolveCampaignAttribution(
    'https://utekos.no/handlehjelp/storrelsesguide',
    session,
    local,
    now
  )
  const snapshot = createCheckoutAttributionSnapshot(
    {
      campaign,
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'granted',
        source: 'cookiebot',
        version: '1'
      },
      page_url: 'https://utekos.no/handlehjelp/storrelsesguide'
    },
    '2026-08-21T12:00:00.000Z'
  )
  const attributes = Object.fromEntries(
    checkoutAttributionSnapshotToShopifyAttributes(snapshot).map(
      attribute => [attribute.key, attribute.value]
    )
  )

  assert.deepEqual(
    {
      utekos_campaign_id: attributes.utekos_campaign_id,
      utekos_campaign_name: attributes.utekos_campaign_name,
      utekos_adset_id: attributes.utekos_adset_id,
      utekos_adset_name: attributes.utekos_adset_name,
      utekos_ad_id: attributes.utekos_ad_id,
      utekos_ad_name: attributes.utekos_ad_name
    },
    {
      utekos_campaign_id: '1201',
      utekos_campaign_name: 'Comfyrobe Sales',
      utekos_adset_id: '1202',
      utekos_adset_name: 'Prospektering',
      utekos_ad_id: '1203',
      utekos_ad_name: 'Video A'
    }
  )
})
