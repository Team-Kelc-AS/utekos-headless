import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLICK_ID_LOCAL_KEY,
  CLICK_ID_SESSION_KEY,
  resolveClickIds
} from './clickIdSessionStore'

function createMemoryStorage(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}))

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    dump() {
      return Object.fromEntries(store)
    }
  }
}

test('resolveClickIds reads click identifiers from the URL', () => {
  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?gclid=google-1&fbclid=meta-1&epik=pinterest-1&unknown=no',
      createMemoryStorage(),
      createMemoryStorage()
    ),
    { epik: 'pinterest-1', gclid: 'google-1', fbclid: 'meta-1' }
  )
})

test('resolveClickIds persists URL click IDs into session and local storage', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-07-20T12:00:00.000Z')

  resolveClickIds(
    'https://utekos.no/?fbclid=meta-persist&epik=pinterest-persist',
    session,
    local,
    now
  )

  assert.equal(
    session.getItem(CLICK_ID_SESSION_KEY),
    JSON.stringify({
      epik: 'pinterest-persist',
      fbclid: 'meta-persist'
    })
  )
  assert.deepEqual(JSON.parse(local.getItem(CLICK_ID_LOCAL_KEY)!), {
    identifiers: {
      epik: 'pinterest-persist',
      fbclid: 'meta-persist'
    },
    updatedAt: '2026-07-20T12:00:00.000Z'
  })
})

test('resolveClickIds merges durable local click IDs when URL and session are empty', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage({
    [CLICK_ID_LOCAL_KEY]: JSON.stringify({
      identifiers: {
        fbclid: 'meta-local',
        gclid: 'google-local'
      },
      updatedAt: '2026-07-19T12:00:00.000Z'
    })
  })

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/skreddersy-varmen',
      session,
      local,
      Date.parse('2026-07-20T12:00:00.000Z')
    ),
    { fbclid: 'meta-local', gclid: 'google-local' }
  )
  assert.equal(
    session.getItem(CLICK_ID_SESSION_KEY),
    JSON.stringify({ fbclid: 'meta-local', gclid: 'google-local' })
  )
})

test('resolveClickIds ignores expired durable local click IDs', () => {
  const local = createMemoryStorage({
    [CLICK_ID_LOCAL_KEY]: JSON.stringify({
      identifiers: { fbclid: 'expired-meta' },
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
  })

  assert.equal(
    resolveClickIds(
      'https://utekos.no/',
      createMemoryStorage(),
      local,
      Date.parse('2026-07-20T12:00:00.000Z')
    ),
    undefined
  )
})

test('resolveClickIds lets fresh URL values win over session and local', () => {
  const session = createMemoryStorage({
    [CLICK_ID_SESSION_KEY]: JSON.stringify({
      fbclid: 'old-meta',
      gclid: 'keep-google'
    })
  })
  const local = createMemoryStorage({
    [CLICK_ID_LOCAL_KEY]: JSON.stringify({
      identifiers: { fbclid: 'older-meta', msclkid: 'bing-1' },
      updatedAt: '2026-07-19T12:00:00.000Z'
    })
  })

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?fbclid=new-meta',
      session,
      local,
      Date.parse('2026-07-20T12:00:00.000Z')
    ),
    { fbclid: 'new-meta', gclid: 'keep-google', msclkid: 'bing-1' }
  )
})
