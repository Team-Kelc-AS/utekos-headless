import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getVippsConfig } from '@/lib/vipps/config'

test('default test config uses only test credentials and verified local subscription alias', () => {
  const c = getVippsConfig({
    VIPPS_MSN_TEST: '123456',
    VIPPS_TEST_CLIENT_ID: 'test-id',
    VIPPS_TEST_CLIENT_SECRET: 'test-secret',
    VIPPS_API_KEY: 'test-sub'
  })
  assert.equal(c.apiBaseUrl, 'https://apitest.vipps.no')
  assert.equal(c.clientId, 'test-id')
})
test('does not fall back to production credentials in test mode', () => {
  assert.throws(
    () =>
      getVippsConfig({
        VIPPS_CLIENT_ID: 'prod',
        VIPPS_CLIENT_SECRET: 'prod',
        VIPPS_OCP_APIM_PRIMARY: 'prod',
        VIPPS_MSN: '728093'
      }),
    /incomplete/
  )
})
test('production requires explicit environment, MSN and complete production credential set', () => {
  assert.throws(
    () =>
      getVippsConfig({
        VIPPS_ENVIRONMENT: 'production',
        VIPPS_MSN_TEST: '123456',
        VIPPS_TEST_CLIENT_ID: 'test',
        VIPPS_TEST_CLIENT_SECRET: 'test',
        VIPPS_API_KEY: 'test'
      }),
    /incomplete/
  )
})
