import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleMetaConnectionGet,
  type MetaConnectionRouteDependencies
} from './route'

const connectionStatus = {
  adAccount: {
    accountStatus: 1 as const,
    currency: 'NOK' as const,
    id: '772268237116474' as const,
    name: 'Utekos Offisiell',
    timeZone: 'America/Los_Angeles' as const
  },
  businessId: '538548380599665' as const,
  catalog: {
    id: '690208780604782' as const,
    name: 'Utekos Catalog',
    productCount: 14,
    vertical: 'commerce'
  },
  checkedAt: '2026-08-29T10:00:00.000Z',
  graphApiVersion: 'v26.0' as const,
  mode: 'read_only' as const,
  mutationsEnabled: false as const,
  ok: true as const,
  operationalTimeZone: 'Europe/Oslo' as const,
  page: { id: '101843722195040' as const, name: 'Utekos' },
  systemUser: {
    id: '122103448539143973' as const,
    name: 'CAPI_Master_User' as const
  }
}

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/internal/meta/connection',
    authorization ? { headers: { authorization } } : undefined
  )
}

function dependencies(
  overrides: Partial<MetaConnectionRouteDependencies> = {}
): MetaConnectionRouteDependencies {
  return {
    getAuthorizationSecret: () => 'correct-secret',
    verify: async () => connectionStatus,
    ...overrides
  }
}

test('rejects unauthorized connection checks before reading Meta', async () => {
  let verifyCount = 0
  const response = await handleMetaConnectionGet(
    request('Bearer wrong-secret'),
    dependencies({
      verify: async () => {
        verifyCount += 1
        return connectionStatus
      }
    })
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(verifyCount, 0)
  assert.deepEqual(await response.json(), { ok: false })
})

test('returns the read-only connection status to an authorized caller', async () => {
  const response = await handleMetaConnectionGet(
    request('Bearer correct-secret'),
    dependencies()
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), connectionStatus)
})

test('returns a safe error without provider messages or credentials', async () => {
  const response = await handleMetaConnectionGet(
    request('Bearer correct-secret'),
    dependencies({
      verify: async () => {
        throw new Error('provider included system-user-token')
      }
    })
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    code: 'meta_marketing_connection_failed',
    ok: false
  })
})
