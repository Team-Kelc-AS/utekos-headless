import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMetaAudienceSessionStore,
  META_AUDIENCE_SESSION_KEY,
  META_AUDIENCE_IDLE_MS
} from './metaAudienceSessionStore'
import { consentedMetaAudience } from './metaAudience'

function setup() {
  const data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    }
  }
  return {
    data,
    storage,
    store: createMetaAudienceSessionStore(() => storage)
  }
}
for (const value of [
  'new_audience',
  'engaged_audience',
  'existing_customers'
]) {
  test(`preserves ${value} from landing through navigation and reload`, () => {
    const { store, storage } = setup()
    assert.equal(
      store.resolve(
        `https://utekos.no/?audience=${value}`,
        true,
        100
      ),
      value
    )
    assert.equal(
      store.resolve('https://utekos.no/produkter', true, 200),
      value
    )
    const reloaded = createMetaAudienceSessionStore(
      () => storage
    )
    assert.equal(
      reloaded.resolve(
        'https://utekos.no/produkter/utekos-techdown',
        true,
        300
      ),
      value
    )
    assert.equal(
      reloaded.resolve('https://utekos.no/cart', true, 400),
      value
    )
  })
}
for (const query of [
  'utm_source=google',
  'fbclid=next-click',
  'campaign_id=next',
  'audience=invalid',
  'audience=',
  'audience=new_audience&audience=existing_customers'
]) {
  test(`clears previous segment at boundary ${query}`, () => {
    const { store, data } = setup()
    store.resolve(
      'https://utekos.no/?audience=engaged_audience',
      true,
      100
    )
    assert.equal(
      store.resolve(`https://utekos.no/?${query}`, true, 200),
      undefined
    )
    assert.equal(
      store.resolve('https://utekos.no/cart', true, 300),
      undefined
    )
    assert.equal(data.has(META_AUDIENCE_SESSION_KEY), false)
  })
}
test('denial clears the stored value and never retains pre-consent activity', () => {
  const { store, data } = setup()
  store.resolve(
    'https://utekos.no/?audience=engaged_audience',
    true,
    100
  )
  assert.equal(
    store.resolve(
      'https://utekos.no/?audience=existing_customers',
      false,
      200
    ),
    undefined
  )
  assert.equal(data.size, 0)
  assert.equal(
    store.resolve('https://utekos.no/cart', true, 300),
    undefined
  )
})
test('expires after inactivity and fails closed for malformed or future storage', () => {
  const { store, data } = setup()
  store.resolve(
    'https://utekos.no/?audience=engaged_audience',
    true,
    100
  )
  assert.equal(
    store.resolve(
      'https://utekos.no/cart',
      true,
      100 + META_AUDIENCE_IDLE_MS
    ),
    undefined
  )
  for (const raw of [
    'bad json',
    JSON.stringify({ value: 'customer', touchedAt: 1 }),
    JSON.stringify({ value: 'new_audience', touchedAt: 999 })
  ]) {
    data.set(META_AUDIENCE_SESSION_KEY, raw)
    assert.equal(
      store.resolve('https://utekos.no/cart', true, 500),
      undefined
    )
    assert.equal(data.size, 0)
  }
})
test('storage failures leave commerce usable and cannot invent a segment', () => {
  const store = createMetaAudienceSessionStore(() => {
    throw new Error('blocked')
  })
  assert.equal(
    store.resolve(
      'https://utekos.no/?audience=new_audience',
      true
    ),
    'new_audience'
  )
  assert.equal(
    store.resolve('https://utekos.no/cart', true),
    undefined
  )
})
test('both consent purposes and a valid enum are required', () => {
  for (const analytics of ['granted', 'denied'] as const)
    for (const marketing of ['granted', 'denied'] as const)
      assert.equal(
        consentedMetaAudience({
          consent: { analytics, marketing },
          meta_audience: 'engaged_audience'
        }),
        analytics === 'granted' && marketing === 'granted' ?
          'engaged_audience'
        : undefined
      )
  assert.equal(
    consentedMetaAudience({
      consent: { analytics: 'granted', marketing: 'granted' },
      meta_audience: 'arbitrary'
    }),
    undefined
  )
})
