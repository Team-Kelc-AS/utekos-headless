import assert from 'node:assert/strict'
import test from 'node:test'

import { readMetaMarketingApiConfig } from './metaMarketingApiConfig'

const requiredEnvironment = {
  META_APP_SECRET: ' app-secret ',
  META_SYSTEM_USER_TOKEN: ' system-user-token '
}

test('reuses the existing system-user token and pins Utekos assets', () => {
  assert.deepEqual(
    readMetaMarketingApiConfig(requiredEnvironment),
    {
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
  )
})

test('accepts the act_ prefix only for the pinned primary account', () => {
  assert.equal(
    readMetaMarketingApiConfig({
      ...requiredEnvironment,
      META_AD_ACCOUNT_ID: ' act_772268237116474 '
    }).adAccountId,
    '772268237116474'
  )

  assert.throws(
    () =>
      readMetaMarketingApiConfig({
        ...requiredEnvironment,
        META_AD_ACCOUNT_ID: '1369297397317769'
      }),
    /meta_marketing_config_mismatch_META_AD_ACCOUNT_ID/u
  )
})

test('requires only the existing server secrets', () => {
  assert.throws(
    () =>
      readMetaMarketingApiConfig({
        META_APP_SECRET: 'app-secret'
      }),
    /meta_marketing_config_missing_META_SYSTEM_USER_TOKEN/u
  )
  assert.throws(
    () =>
      readMetaMarketingApiConfig({
        META_SYSTEM_USER_TOKEN: 'system-user-token'
      }),
    /meta_marketing_config_missing_META_APP_SECRET/u
  )
})

test('enables the future mutation gate only for an exact true value', () => {
  assert.equal(
    readMetaMarketingApiConfig({
      ...requiredEnvironment,
      META_MARKETING_API_MUTATIONS_ENABLED: 'TRUE'
    }).mutationsEnabled,
    false
  )
  assert.equal(
    readMetaMarketingApiConfig({
      ...requiredEnvironment,
      META_MARKETING_API_MUTATIONS_ENABLED: 'true'
    }).mutationsEnabled,
    true
  )
})
