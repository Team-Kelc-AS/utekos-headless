import assert from 'node:assert/strict'
import test from 'node:test'

import { readLocalImplementation } from './audit-account.mjs'
import { analyzeMicrosoftAdsTrackingHealth } from './health/tracking-health.mjs'

test('runtime implementation scan excludes test and spec fixtures', () => {
  const implementation = readLocalImplementation()

  assert.equal(
    implementation.inspectedFiles.some(file =>
      /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file.path)
    ),
    false
  )
  assert.equal(
    implementation.productPurchaseGoal.localHelperEventAction,
    'unknown'
  )
  assert.equal(
    implementation.productPurchaseGoal.serverCapiEventAction,
    'purchase'
  )

  const health = analyzeMicrosoftAdsTrackingHealth({
    localImplementation: implementation
  })
  assert.equal(
    health.findings.some(
      finding => finding.code === 'MICROSOFT_BROWSER_CAPI_EVENT_NAME_MISMATCH'
    ),
    false
  )
})
