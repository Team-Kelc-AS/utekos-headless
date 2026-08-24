import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLICK_ID_LOCAL_KEY,
  CLICK_ID_SESSION_KEY,
  clearEphemeralSnapchatClickId,
  clearStoredSnapchatClickId,
  resolveClickIds
} from './clickIdSessionStore'

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
  assert.deepEqual(
    JSON.parse(local.getItem(CLICK_ID_LOCAL_KEY)!),
    {
      identifiers: {
        epik: 'pinterest-persist',
        fbclid: 'meta-persist'
      },
      updatedAt: '2026-07-20T12:00:00.000Z'
    }
  )
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
    JSON.stringify({
      fbclid: 'meta-local',
      gclid: 'google-local'
    })
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

test('persist=false does not read durable click ID storage', () => {
  clearEphemeralSnapchatClickId()
  const session = createMemoryStorage({
    [CLICK_ID_SESSION_KEY]: JSON.stringify({
      fbclid: 'meta-session'
    })
  })
  const local = createMemoryStorage({
    [CLICK_ID_LOCAL_KEY]: JSON.stringify({
      identifiers: { msclkid: 'microsoft-local' },
      updatedAt: '2026-08-23T10:00:00.000Z'
    })
  })

  assert.equal(
    resolveClickIds(
      'https://utekos.no/',
      session,
      local,
      Date.parse('2026-08-23T10:00:00.000Z'),
      {},
      false
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
    {
      fbclid: 'new-meta',
      gclid: 'keep-google',
      msclkid: 'bing-1'
    }
  )
})

test('resolveClickIds persists a freshly observed Pinterest _epik value', () => {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-08-21T08:00:00.000Z')

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/produkter/comfyrobe',
      session,
      local,
      now,
      { epik: 'pinterest-cookie-1' }
    ),
    { epik: 'pinterest-cookie-1' }
  )
  assert.equal(
    session.getItem(CLICK_ID_SESSION_KEY),
    JSON.stringify({ epik: 'pinterest-cookie-1' })
  )
  assert.deepEqual(
    JSON.parse(local.getItem(CLICK_ID_LOCAL_KEY)!),
    {
      identifiers: { epik: 'pinterest-cookie-1' },
      updatedAt: '2026-08-21T08:00:00.000Z'
    }
  )
})

test('resolveClickIds lets a fresh URL epik win over the Pinterest cookie', () => {
  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?epik=pinterest-url-new',
      createMemoryStorage(),
      createMemoryStorage(),
      Date.parse('2026-08-21T08:00:00.000Z'),
      { epik: 'pinterest-cookie-old' }
    ),
    { epik: 'pinterest-url-new' }
  )
})

test('keeps ScCid ephemeral until marketing consent allows persistence', () => {
  clearEphemeralSnapchatClickId()
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  const now = Date.parse('2026-08-23T10:00:00.000Z')

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/?ScCid=%20AbC-._%2B%2F%3D%20',
      session,
      local,
      now,
      {},
      false
    ),
    { sc_click_id: ' AbC-._+/= ' }
  )
  assert.deepEqual(session.dump(), {})
  assert.deepEqual(local.dump(), {})

  assert.deepEqual(
    resolveClickIds(
      'https://utekos.no/produkter/comfyrobe',
      session,
      local,
      now,
      {},
      true
    ),
    { sc_click_id: ' AbC-._+/= ' }
  )
  assert.equal(
    session.getItem(CLICK_ID_SESSION_KEY),
    JSON.stringify({ sc_click_id: ' AbC-._+/= ' })
  )
  clearEphemeralSnapchatClickId()
})

test('removes only Snapchat attribution after consent withdrawal', () => {
  const session = createMemoryStorage({
    [CLICK_ID_SESSION_KEY]: JSON.stringify({
      gclid: 'google-1',
      sc_click_id: 'snap-1'
    })
  })
  const local = createMemoryStorage({
    [CLICK_ID_LOCAL_KEY]: JSON.stringify({
      identifiers: { gclid: 'google-1', sc_click_id: 'snap-1' },
      updatedAt: '2026-08-23T10:00:00.000Z'
    })
  })

  clearStoredSnapchatClickId(session, local)

  assert.deepEqual(
    JSON.parse(session.getItem(CLICK_ID_SESSION_KEY)!),
    { gclid: 'google-1' }
  )
  assert.deepEqual(
    JSON.parse(local.getItem(CLICK_ID_LOCAL_KEY)!),
    {
      identifiers: { gclid: 'google-1' },
      updatedAt: '2026-08-23T10:00:00.000Z'
    }
  )
})
