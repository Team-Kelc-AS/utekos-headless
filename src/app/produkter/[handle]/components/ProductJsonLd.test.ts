import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveProductJsonLdData } from '../utils/resolveProductJsonLdData'

test('omits noncritical product JSON-LD when Shopify fails', async () => {
  const error = new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
  const failures: unknown[] = []

  const data = await resolveProductJsonLdData(
    'utekos-techdown',
    {
      loadCommerce: async () => {
        throw error
      },
      onError: capturedError => {
        failures.push(capturedError)
      }
    }
  )

  assert.equal(data, null)
  assert.deepEqual(failures, [error])
})

test('does not query Shopify for an unknown product handle', async () => {
  let commerceCalls = 0

  const data = await resolveProductJsonLdData(
    'unknown-product',
    {
      loadCommerce: async () => {
        commerceCalls += 1
        return null
      }
    }
  )

  assert.equal(data, null)
  assert.equal(commerceCalls, 0)
})
