import assert from 'node:assert/strict'
import { test } from 'node:test'
import { metaInsightsDocs } from './metaInsightsBreakdownCatalog'
import {
  metaInsightsFeatureSettingNames,
  metaInsightsFeatureSettingsInventory
} from './metaInsightsFeatureSettings'

test('feature-settings inventory is GET-only and already enabled', () => {
  assert.equal(
    metaInsightsDocs.featureSettings.includes('feature-settings'),
    true
  )
  assert.equal(metaInsightsDocs.changelog.includes('changelog'), true)
  assert.equal(
    metaInsightsFeatureSettingsInventory.method,
    'GET'
  )
  assert.deepEqual(
    metaInsightsFeatureSettingNames,
    [
      'comscore',
      'frequency_value',
      'impression_device',
      'time_of_day_viewer_tz'
    ]
  )
  assert.equal(
    metaInsightsFeatureSettingsInventory.enabled.length,
    4
  )
  assert.equal(
    metaInsightsFeatureSettingsInventory.enabled.every(
      feature => feature.status === 'enabled'
    ),
    true
  )
})
