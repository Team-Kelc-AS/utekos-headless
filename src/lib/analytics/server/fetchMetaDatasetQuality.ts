import { z } from 'zod'
import {
  metaDatasetQualityResponseSchema,
  type MetaDatasetQualityResponse
} from './metaDatasetQualitySchema'

const META_DATASET_QUALITY_API_VERSION = 'v25.0'
const META_DATASET_QUALITY_TIMEOUT_MS = 10_000
const META_DATASET_QUALITY_FIELDS =
  'web{event_name,event_match_quality{composite_score,match_key_feedback{identifier,coverage{percentage},potential_aly_acr_increase{percentage,description}},diagnostics{name,description,solution,percentage,affected_event_count,total_event_count}},event_coverage{percentage,goal_percentage,description},dedupe_key_feedback{dedupe_key,browser_events_with_dedupe_key{percentage,description},server_events_with_dedupe_key{percentage,description},overall_browser_coverage_from_dedupe_key{percentage,description}},data_freshness{upload_frequency,description},acr{percentage,description},event_potential_aly_acr_increase{percentage,description}}'

type Environment = Readonly<Record<string, string | undefined>>

export type MetaDatasetQualityConfig = {
  accessToken: string
  datasetId: string
}

type MetaDatasetQualityFetchResponse = Pick<
  Response,
  'json' | 'ok' | 'status'
>

export type MetaDatasetQualityFetch = (
  input: string,
  init: RequestInit
) => Promise<MetaDatasetQualityFetchResponse>

const metaErrorSchema = z
  .object({
    error: z
      .object({
        code: z.number().optional(),
        error_subcode: z.number().optional(),
        is_transient: z.boolean().optional(),
        type: z.string().optional()
      })
      .passthrough()
  })
  .passthrough()

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
  return {
    accessToken: firstEnvironmentValue(environment, [
      'META_SYSTEM_USER_TOKEN',
      'META_ACCESS_TOKEN'
    ]),
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
    `https://graph.facebook.com/${META_DATASET_QUALITY_API_VERSION}/dataset_quality`
  )
  url.searchParams.set('dataset_id', config.datasetId)
  url.searchParams.set('fields', META_DATASET_QUALITY_FIELDS)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImplementation(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${config.accessToken}`
      },
      method: 'GET',
      signal: controller.signal
    })
    const body: unknown = await response.json()

    if (!response.ok) {
      const error = metaErrorSchema.safeParse(body)
      const code = error.success ? error.data.error.code : undefined
      const suffix = code === undefined ? '' : ` (code ${code})`

      throw new Error(
        `Meta Dataset Quality request failed with HTTP ${response.status}${suffix}`
      )
    }

    return metaDatasetQualityResponseSchema.parse(body)
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `Meta Dataset Quality request exceeded ${timeoutMs}ms`
      )
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
