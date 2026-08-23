import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CAMPAIGN_ATTRIBUTION_LOCAL_KEY,
  CAMPAIGN_ATTRIBUTION_SESSION_KEY,
  resolveCampaignAttribution
} from './campaignAttributionSessionStore'

function createMemoryStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(
    Object.entries(initial ?? {})
  )

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

test('resolves campaign hierarchy names and ids from landing URL parameters', () => {
  assert.deepEqual(
    resolveCampaignAttribution(
      'https://utekos.no/produkter/comfyrobe?campaign_name=Comfyrobe%20Sales&campaign_id=1201&adset_name=Prospektering&adset_id=1202&ad_name=Video%20A&ad_id=1203',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    {
      campaign_id: '1201',
      campaign_name: 'Comfyrobe Sales',
      adset_id: '1202',
      adset_name: 'Prospektering',
      ad_id: '1203',
      ad_name: 'Video A'
    }
  )
})

test('uses utm_campaign as the campaign name fallback', () => {
  assert.deepEqual(
    resolveCampaignAttribution(
      'https://utekos.no/?utm_campaign=hostkampanje&adset_id=2202&ad_id=2203',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    {
      campaign_name: 'hostkampanje',
      adset_id: '2202',
      ad_id: '2203'
    }
  )
})

test('uses utm_campaign when an explicit campaign name is invalid', () => {
  assert.deepEqual(
    resolveCampaignAttribution(
      'https://utekos.no/?campaign_name=%20%20&utm_campaign=valid-fallback',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    { campaign_name: 'valid-fallback' }
  )
})

test('persists one coherent campaign hierarchy across internal navigation', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-08-21T12:00:00.000Z')

  resolveCampaignAttribution(
    'https://utekos.no/?campaign_id=3201&adset_id=3202&ad_id=3203',
    session,
    local,
    now
  )

  assert.deepEqual(
    resolveCampaignAttribution(
      'https://utekos.no/handlehjelp/storrelsesguide',
      session,
      local,
      now
    ),
    { campaign_id: '3201', adset_id: '3202', ad_id: '3203' }
  )
  assert.equal(
    session.getItem(CAMPAIGN_ATTRIBUTION_SESSION_KEY),
    JSON.stringify({
      campaign_id: '3201',
      adset_id: '3202',
      ad_id: '3203'
    })
  )
  assert.deepEqual(
    JSON.parse(local.getItem(CAMPAIGN_ATTRIBUTION_LOCAL_KEY)!),
    {
      attribution: {
        campaign_id: '3201',
        adset_id: '3202',
        ad_id: '3203'
      },
      updatedAt: '2026-08-21T12:00:00.000Z'
    }
  )
})

test('replaces the complete hierarchy when a newer campaign is observed', () => {
  const session = createMemoryStorage({
    [CAMPAIGN_ATTRIBUTION_SESSION_KEY]: JSON.stringify({
      campaign_id: 'old-campaign',
      adset_id: 'old-adset',
      ad_id: 'old-ad'
    })
  })

  assert.deepEqual(
    resolveCampaignAttribution(
      'https://utekos.no/?utm_campaign=new-email-campaign',
      session,
      createMemoryStorage()
    ),
    { campaign_name: 'new-email-campaign' }
  )
})

test('clears stale campaign metadata when a new untagged paid click arrives', () => {
  const session = createMemoryStorage({
    [CAMPAIGN_ATTRIBUTION_SESSION_KEY]: JSON.stringify({
      campaign_id: 'old-campaign',
      adset_id: 'old-adset',
      ad_id: 'old-ad'
    })
  })
  const local = createMemoryStorage({
    [CAMPAIGN_ATTRIBUTION_LOCAL_KEY]: JSON.stringify({
      attribution: { campaign_id: 'old-campaign' },
      updatedAt: '2026-08-20T12:00:00.000Z'
    })
  })

  assert.equal(
    resolveCampaignAttribution(
      'https://utekos.no/?fbclid=new-click-without-hierarchy',
      session,
      local,
      Date.parse('2026-08-21T12:00:00.000Z')
    ),
    undefined
  )
  assert.equal(
    session.getItem(CAMPAIGN_ATTRIBUTION_SESSION_KEY),
    null
  )
  assert.equal(
    local.getItem(CAMPAIGN_ATTRIBUTION_LOCAL_KEY),
    null
  )
})

test('treats the exact Snapchat ScCid parameter as a new paid-click boundary', () => {
  const session = createMemoryStorage({
    [CAMPAIGN_ATTRIBUTION_SESSION_KEY]: JSON.stringify({
      campaign_id: 'old-campaign'
    })
  })

  assert.equal(
    resolveCampaignAttribution(
      'https://utekos.no/?ScCid=opaque-snap-click',
      session,
      createMemoryStorage()
    ),
    undefined
  )
  assert.equal(
    session.getItem(CAMPAIGN_ATTRIBUTION_SESSION_KEY),
    null
  )
})

test('ignores expired durable campaign attribution', () => {
  const local = createMemoryStorage({
    [CAMPAIGN_ATTRIBUTION_LOCAL_KEY]: JSON.stringify({
      attribution: { campaign_id: 'expired-campaign' },
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
  })

  assert.equal(
    resolveCampaignAttribution(
      'https://utekos.no/',
      createMemoryStorage(),
      local,
      Date.parse('2026-08-21T12:00:00.000Z')
    ),
    undefined
  )
})

test('drops unknown, blank, and oversized URL values', () => {
  assert.deepEqual(
    resolveCampaignAttribution(
      `https://utekos.no/?campaign_id=valid&adset_name=%20%20&ad_name=${'a'.repeat(501)}&customer_email=drop-me`,
      createMemoryStorage(),
      createMemoryStorage()
    ),
    { campaign_id: 'valid' }
  )
})
