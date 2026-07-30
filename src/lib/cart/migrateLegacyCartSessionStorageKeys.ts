import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'

const CART_SESSION_STORAGE_PREFIXES = [
  'utekos:checkout_attribution:',
  'utekos:checkout_consent:'
] as const

type SessionStorageLike = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'
>

export function migrateLegacyCartSessionStorageKeys(
  storage: SessionStorageLike
): void {
  const keys = Array.from(
    { length: storage.length },
    (_, index) => storage.key(index)
  ).filter((key): key is string => key !== null)

  for (const key of keys) {
    const prefix = CART_SESSION_STORAGE_PREFIXES.find(
      candidate => key.startsWith(candidate)
    )
    if (!prefix) continue

    const legacyCartId = key.slice(prefix.length)
    if (!legacyCartId.includes('?key=')) continue

    const identity = parseShopifyCartId(legacyCartId)
    const value = storage.getItem(key)
    storage.removeItem(key)

    if (identity && value !== null) {
      const publicKey = `${prefix}${identity.publicId}`
      try {
        if (storage.getItem(publicKey) === null) {
          storage.setItem(publicKey, value)
        }
      } catch {
        // Removing the secret-bearing key takes precedence over migration.
      }
    }
  }
}
