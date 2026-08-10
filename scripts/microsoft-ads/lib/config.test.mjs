import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getConfiguredMicrosoftAdsAccountIds,
  loadMicrosoftAdsConfig,
  selectMicrosoftAdsAccountConfig
} from './config.mjs'

const processEnv = {
  MICROSOFT_ADS_ACCOUNT_ID: '188365141',
  MICROSOFT_ADS_CUSTOMER_ID: '254835341',
  MICROSOFT_ADS_MASTER_ACCOUNT_ID: '188445594',
  MICROSOFT_ADS_MASTER_ACCOUNT_NUMBER: 'G120L495',
  MICROSOFT_ADS_MASTER_MANAGER_ACCOUNT_ID: '254835341',
  MICROSOFT_ADS_MASTER_MANAGER_ACCOUNT_NUMBER: 'K120006WEF'
}

test('loads both configured Microsoft Advertising accounts', () => {
  const config = loadMicrosoftAdsConfig({ processEnv, envFiles: [] })

  assert.deepEqual(getConfiguredMicrosoftAdsAccountIds(config), [
    '188365141',
    '188445594'
  ])
  assert.equal(config.masterAccountNumber, 'G120L495')
  assert.equal(config.masterManagerAccountNumber, 'K120006WEF')
})

test('selects only an allowlisted Microsoft Advertising account', () => {
  const config = loadMicrosoftAdsConfig({ processEnv, envFiles: [] })

  assert.equal(selectMicrosoftAdsAccountConfig(config).accountId, '188365141')
  assert.equal(
    selectMicrosoftAdsAccountConfig(config, '188445594').accountId,
    '188445594'
  )
  assert.throws(
    () => selectMicrosoftAdsAccountConfig(config, '999999999'),
    /not in the configured account allowlist/
  )
})
