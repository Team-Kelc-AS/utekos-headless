import assert from 'node:assert/strict'
import test from 'node:test'

import { migrateLegacyCartSessionStorageKeys } from './migrateLegacyCartSessionStorageKeys'

function createStorage(entries: Array<[string, string]>) {
  const values = new Map(entries)

  return {
    get length() {
      return values.size
    },
    key(index: number) {
      return [...values.keys()][index] ?? null
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    }
  }
}

test('migrates scoped legacy keys to public cart identities and removes secrets', () => {
  const prefix = 'utekos:checkout_consent:'
  const fullId = 'gid://shopify/Cart/opaque?key=legacy-secret'
  const storage = createStorage([
    [`${prefix}${fullId}`, '{"analytics":"denied"}'],
    ['unrelated:key?key=keep', 'untouched']
  ])

  migrateLegacyCartSessionStorageKeys(storage)

  assert.equal(storage.getItem(`${prefix}${fullId}`), null)
  assert.equal(
    storage.getItem(`${prefix}gid://shopify/Cart/opaque`),
    '{"analytics":"denied"}'
  )
  assert.equal(
    storage.getItem('unrelated:key?key=keep'),
    'untouched'
  )
})

test('removes the secret-bearing key even when public migration exceeds quota', () => {
  const prefix = 'utekos:checkout_attribution:'
  const fullId = 'gid://shopify/Cart/opaque?key=legacy-secret'
  const storage = createStorage([[`${prefix}${fullId}`, '{}']])
  storage.setItem = () => {
    throw new Error('QuotaExceededError')
  }

  migrateLegacyCartSessionStorageKeys(storage)

  assert.equal(storage.getItem(`${prefix}${fullId}`), null)
})
