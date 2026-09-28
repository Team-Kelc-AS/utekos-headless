import assert from 'node:assert/strict'
import test from 'node:test'

import { getKlarnaPublicConfig } from '@/lib/klarna/getKlarnaPublicConfig'

test('returns a validated production Klarna client configuration', () => {
  const config = getKlarnaPublicConfig({
    NEXT_PUBLIC_KLARNA_CLIENT_ID:
      'klarna_live_client_example'
  })

  assert.deepEqual(config, {
    client_id: 'klarna_live_client_example',
    environment: 'production'
  })
})

test('rejects a missing or malformed Klarna client identifier', () => {
  assert.throws(
    () => getKlarnaPublicConfig({}),
    /Klarna public configuration is not available/
  )
  assert.throws(
    () =>
      getKlarnaPublicConfig({
        NEXT_PUBLIC_KLARNA_CLIENT_ID: 'not-a-client-id'
      }),
    /Klarna public configuration is not available/
  )
})
