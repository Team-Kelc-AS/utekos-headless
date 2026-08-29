import assert from 'node:assert/strict'
import test from 'node:test'

import type { MetaGraphFetch } from './fetchMetaGraphJson'
import type { MetaMarketingApiConfig } from './metaMarketingApiConfig'
import { verifyMetaMarketingConnection } from './verifyMetaMarketingConnection'

const config: MetaMarketingApiConfig = {
  accessToken: 'system-user-token',
  adAccountId: '772268237116474',
  appId: '1154247890253046',
  appSecret: 'app-secret',
  businessId: '538548380599665',
  catalogId: '690208780604782',
  commerceAccountId: '810470868471691',
  mutationsEnabled: false,
  pageId: '101843722195040'
}

function successfulFetch(
  overrides: { adAccountTimeZone?: string } = {}
) {
  const calls: Array<{ init: RequestInit; url: URL }> = []
  const fetchImplementation: MetaGraphFetch = async (
    input,
    init
  ) => {
    const url = new URL(input)
    calls.push({ init, url })

    const body =
      url.pathname.endsWith('/me') ?
        { id: '122103448539143973', name: 'CAPI_Master_User' }
      : url.pathname.endsWith('/act_772268237116474') ?
        {
          account_id: '772268237116474',
          account_status: 1,
          business: { id: '538548380599665' },
          currency: 'NOK',
          id: 'act_772268237116474',
          name: 'Utekos Offisiell',
          timezone_name:
            overrides.adAccountTimeZone ?? 'America/Los_Angeles'
        }
      : url.pathname.endsWith('/690208780604782') ?
        {
          business: { id: '538548380599665' },
          id: '690208780604782',
          name: 'Utekos Catalog',
          product_count: 14,
          vertical: 'commerce'
        }
      : url.pathname.endsWith('/101843722195040') ?
        { id: '101843722195040', name: 'Utekos' }
      : null

    return {
      json: async () => body,
      ok: body !== null,
      status: body === null ? 404 : 200
    }
  }

  return { calls, fetchImplementation }
}

test('verifies the pinned system user and business assets read-only', async () => {
  const { calls, fetchImplementation } = successfulFetch()
  const result = await verifyMetaMarketingConnection(config, {
    fetchImplementation,
    now: new Date('2026-08-29T10:00:00.000Z')
  })

  assert.deepEqual(result, {
    adAccount: {
      accountStatus: 1,
      currency: 'NOK',
      id: '772268237116474',
      name: 'Utekos Offisiell',
      timeZone: 'America/Los_Angeles'
    },
    businessId: '538548380599665',
    catalog: {
      id: '690208780604782',
      name: 'Utekos Catalog',
      productCount: 14,
      vertical: 'commerce'
    },
    checkedAt: '2026-08-29T10:00:00.000Z',
    graphApiVersion: 'v26.0',
    mode: 'read_only',
    mutationsEnabled: false,
    ok: true,
    operationalTimeZone: 'Europe/Oslo',
    page: { id: '101843722195040', name: 'Utekos' },
    systemUser: {
      id: '122103448539143973',
      name: 'CAPI_Master_User'
    }
  })
  assert.equal(calls.length, 4)
  for (const call of calls) {
    assert.equal(call.init.method, 'GET')
    assert.equal(call.url.pathname.startsWith('/v26.0/'), true)
    assert.equal(
      call.url.searchParams.has('appsecret_proof'),
      true
    )
    assert.equal(
      call.url.searchParams.has('access_token'),
      false
    )
  }
  assert.doesNotMatch(
    JSON.stringify(result),
    /system-user-token|app-secret/u
  )
})

test('fails closed if Meta reports the secondary account timezone', async () => {
  const { fetchImplementation } = successfulFetch({
    adAccountTimeZone: 'Europe/Oslo'
  })

  await assert.rejects(
    verifyMetaMarketingConnection(config, {
      fetchImplementation
    }),
    /meta_marketing_ad_account_timezone_mismatch/u
  )
})

test('performs no provider calls while mutation mode is enabled', async () => {
  let callCount = 0

  await assert.rejects(
    verifyMetaMarketingConnection(
      { ...config, mutationsEnabled: true },
      {
        fetchImplementation: async () => {
          callCount += 1
          throw new Error('must not call Meta')
        }
      }
    ),
    /meta_marketing_mutations_must_remain_disabled/u
  )
  assert.equal(callCount, 0)
})
