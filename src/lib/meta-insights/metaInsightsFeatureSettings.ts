import { metaInsightsDocs } from './metaInsightsBreakdownCatalog'

export const metaInsightsFeatureSettingNames = [
  'comscore',
  'frequency_value',
  'impression_device',
  'time_of_day_viewer_tz'
] as const

export type MetaInsightsFeatureSettingName =
  (typeof metaInsightsFeatureSettingNames)[number]

export const metaInsightsFeatureSettingsDocs = {
  featureSettings: metaInsightsDocs.featureSettings,
  changelog: metaInsightsDocs.changelog,
  changelogV26: metaInsightsDocs.changelogV26,
  marketingChangelog: metaInsightsDocs.marketingChangelog
} as const

export const metaInsightsFeatureSettingsInventory = {
  accountId: '772268237116474',
  fetchedAtOslo: '2026-09-12T00:55:00+02:00',
  method: 'GET',
  catalog: metaInsightsFeatureSettingNames,
  enabled: [
    {
      featureName: 'frequency_value',
      status: 'enabled',
      insightsEffectiveDate: '2026-06-21'
    },
    {
      featureName: 'impression_device',
      status: 'enabled',
      insightsEffectiveDate: null
    },
    {
      featureName: 'time_of_day_viewer_tz',
      status: 'enabled',
      insightsEffectiveDate: null
    },
    {
      featureName: 'comscore',
      status: 'enabled',
      insightsEffectiveDate: null
    }
  ]
} as const
