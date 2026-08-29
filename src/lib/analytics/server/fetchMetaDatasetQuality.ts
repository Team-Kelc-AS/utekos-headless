import {
  metaDatasetQualityResponseSchema,
  type MetaDatasetQualityResponse
} from './metaDatasetQualitySchema'
import {
  fetchMetaGraphJson,
  type MetaGraphFetch
} from './fetchMetaGraphJson'
import { META_GRAPH_API_VERSION } from '@/lib/meta/metaAssets'

const META_DATASET_QUALITY_TIMEOUT_MS = 10_000
const META_DATASET_QUALITY_FIELDS =
  'web{event_name,event_match_quality{composite_score,match_key_feedback{identifier,coverage{percentage},potential_aly_acr_increase{percentage,description}},diagnostics{name,description,solution,percentage,affected_event_count,total_event_count}},event_coverage{percentage,goal_percentage,description},dedupe_key_feedback{dedupe_key,browser_events_with_dedupe_key{percentage,description},server_events_with_dedupe_key{percentage,description},overall_browser_coverage_from_dedupe_key{percentage,description}},data_freshness{upload_frequency,description},acr{percentage,description},event_potential_aly_acr_increase{percentage,description}}'

type Environment = Readonly<Record<string, string | undefined>>

export type MetaDatasetQualityConfig = {
  accessToken: string
  appSecret?: string
  datasetId: string
}

export type MetaDatasetQualityFetch = MetaGraphFetch

function firstEnvironmentValue(
  environment: Environment,
  names: string[]
) {
  for (const name of names) {
    const value = environment[name]?.trim()
    if (value) return value
  }

  throw new Error(
    `Missing required Meta Dataset Quality configuration: ${names.join(' or ')}`
  )
}

export function readMetaDatasetQualityConfig(
  environment: Environment = process.env
): MetaDatasetQualityConfig {
  const appSecret = environment.META_APP_SECRET?.trim()

  return {
    accessToken: firstEnvironmentValue(environment, [
      'META_SYSTEM_USER_TOKEN',
      'META_ACCESS_TOKEN'
    ]),
    ...(appSecret ? { appSecret } : {}),
    datasetId: firstEnvironmentValue(environment, [
      'META_PIXEL_ID',
      'NEXT_PUBLIC_META_PIXEL_ID'
    ])
  }
}

export async function fetchMetaDatasetQuality(
  config: MetaDatasetQualityConfig,
  fetchImplementation: MetaDatasetQualityFetch = (input, init) =>
    fetch(input, init),
  timeoutMs = META_DATASET_QUALITY_TIMEOUT_MS
): Promise<MetaDatasetQualityResponse> {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      'Meta Dataset Quality timeout must be a positive integer'
    )
  }

  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/dataset_quality`
  )
  url.searchParams.set('dataset_id', config.datasetId)
  url.searchParams.set('fields', META_DATASET_QUALITY_FIELDS)

  return fetchMetaGraphJson({
    accessToken: config.accessToken,
    ...(config.appSecret ? { appSecret: config.appSecret } : {}),
    fetchImplementation,
    schema: metaDatasetQualityResponseSchema,
    timeoutMs,
    url
  })
}
