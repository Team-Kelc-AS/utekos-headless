import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalEventNames,
  eventCatalog,
  type ProviderId as CatalogProviderId
} from '@/lib/analytics/eventCatalog'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from '@/lib/analytics/server/providerAdapterRegistry'
import { providerOutboxWorkerRegistry } from '@/lib/analytics/server/providerOutboxWorkerRegistry'

const providerIds = [
  'supabase',
  'google',
  'meta',
  'microsoft_uet',
  'pinterest',
  'snapchat'
] as const satisfies readonly CatalogProviderId[]

const providerAdapterKeys = Object.keys(
  providerAdapterRegistry
) as RegisteredProviderAdapterKey[]

test('keeps catalog, adapters, and workers in one active-outbox allowlist', () => {
  const catalogKeys = canonicalEventNames.flatMap(eventName =>
    providerIds.flatMap(providerId =>
      (
        eventCatalog[eventName].providers[providerId]
          .serverOutbox === 'active'
      ) ?
        [`${providerId}:${eventName}`]
      : []
    )
  )
  const adapterKeys = [...providerAdapterKeys]
  const workerKeys = Object.keys(providerOutboxWorkerRegistry)

  assert.deepEqual(
    [...adapterKeys].sort(),
    [...catalogKeys].sort()
  )
  assert.deepEqual(
    [...workerKeys].sort(),
    [...catalogKeys].sort()
  )

  for (const key of adapterKeys) {
    assert.equal(providerAdapterRegistry[key].key, key)
  }
})
