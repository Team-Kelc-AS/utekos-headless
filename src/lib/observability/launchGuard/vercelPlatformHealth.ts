import 'server-only'

import { z } from 'zod'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import type { IntegrationHealthSnapshot } from './integrationHealthSnapshot'

const VERCEL_API_ORIGIN = 'https://api.vercel.com'
const VERCEL_API_TIMEOUT_MS = 8_000
const TRAFFIC_WINDOW_SECONDS = 15 * 60

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

type VercelPlatformHealthEnvironment = Readonly<
  Record<string, string | undefined>
>

type VercelPlatformHealthInput = {
  environment: VercelPlatformHealthEnvironment
  fetch: FetchLike
  now: () => Date
  runId: string
}

const webAnalyticsCountSchema = z.object({
  data: z.object({
    pageviews: z.number().int().nonnegative(),
    visitors: z.number().int().nonnegative()
  })
})

const drainSchema = z.object({
  projectIds: z.array(z.string()).optional(),
  status: z.enum(['disabled', 'enabled', 'errored']),
  schemas: z.record(z.string(), z.unknown()).optional(),
  sampling: z
    .array(
      z.object({
        env: z.string().optional(),
        rate: z.union([z.string(), z.number()]).optional(),
        requestPath: z.string().optional()
      })
    )
    .optional(),
  filterV2: z
    .object({
      filter: z
        .object({
          project: z
            .object({ ids: z.array(z.string()).optional() })
            .optional(),
          deployment: z
            .object({
              environments: z.array(z.string()).optional()
            })
            .optional()
        })
        .optional()
    })
    .optional()
})

const drainsResponseSchema = z.object({
  drains: z.array(drainSchema)
})

function nonEmpty(value: string | undefined) {
  const normalized = value?.trim()
  return normalized || undefined
}

function resolveConfig(
  environment: VercelPlatformHealthEnvironment
) {
  const token = nonEmpty(
    environment.UTEKOS_VERCEL_API_TOKEN ??
      environment.VERCEL_API_TOKEN ??
      environment.VERCEL_TOKEN
  )
  const projectId = nonEmpty(
    environment.UTEKOS_VERCEL_PROJECT_ID ??
      environment.VERCEL_PROJECT_ID
  )
  const teamId = nonEmpty(
    environment.UTEKOS_VERCEL_TEAM_ID ??
      environment.VERCEL_TEAM_ID
  )

  return token && projectId && teamId ?
      { token, projectId, teamId }
    : null
}

function configurationSnapshot(
  input: VercelPlatformHealthInput,
  surface: string
) {
  return parseIntegrationHealthSnapshot({
    runId: input.runId,
    integration: 'vercel',
    surface,
    status: 'not_configured',
    severity: 'low',
    checkedAt: input.now().toISOString(),
    sampleCount: 0,
    errorCount: 0,
    evidenceLevel: 'configuration',
    providerReceiptStatus: 'not_checked',
    resultCode: 'vercel_api_credentials_missing',
    measurements: {}
  })
}

async function vercelGet(
  path: string,
  config: NonNullable<ReturnType<typeof resolveConfig>>,
  fetch: FetchLike
) {
  const response = await fetch(
    new URL(path, VERCEL_API_ORIGIN),
    {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.token}`
      },
      signal: AbortSignal.timeout(VERCEL_API_TIMEOUT_MS)
    }
  )

  if (!response.ok) {
    throw new Error(`vercel_api_status_${response.status}`)
  }

  return response.json()
}

async function readRouteTraffic(
  input: VercelPlatformHealthInput,
  config: NonNullable<ReturnType<typeof resolveConfig>>
): Promise<IntegrationHealthSnapshot> {
  const until = input.now()
  const since = new Date(
    until.getTime() - TRAFFIC_WINDOW_SECONDS * 1_000
  )
  const parameters = new URLSearchParams({
    filter: 'requestPath eq \'/skreddersy-varmen\'',
    projectId: config.projectId,
    since: since.toISOString(),
    teamId: config.teamId,
    until: until.toISOString()
  })

  try {
    const result = webAnalyticsCountSchema.parse(
      await vercelGet(
        `/v1/query/web-analytics/visits/count?${parameters}`,
        config,
        input.fetch
      )
    )

    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'vercel',
      surface: 'web_analytics_route_traffic',
      status: 'healthy',
      severity: 'info',
      checkedAt: until.toISOString(),
      dataFreshnessSeconds: 0,
      trafficWindowSeconds: TRAFFIC_WINDOW_SECONDS,
      sampleCount: result.data.pageviews,
      errorCount: 0,
      evidenceLevel: 'platform_observation',
      providerReceiptStatus: 'verified',
      resultCode: 'vercel_web_analytics_readback_verified',
      measurements: {
        pageviews: result.data.pageviews,
        visitors: result.data.visitors
      }
    })
  } catch {
    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'vercel',
      surface: 'web_analytics_route_traffic',
      status: 'degraded',
      severity: 'high',
      checkedAt: until.toISOString(),
      trafficWindowSeconds: TRAFFIC_WINDOW_SECONDS,
      sampleCount: 1,
      errorCount: 1,
      evidenceLevel: 'platform_observation',
      providerReceiptStatus: 'rejected',
      errorFingerprint: 'vercel:web_analytics:readback_failed',
      resultCode: 'vercel_web_analytics_readback_failed',
      safeAction: 'retry_probe_once',
      measurements: {}
    })
  }
}

function appliesToProject(
  drain: z.infer<typeof drainSchema>,
  projectId: string
) {
  const explicitIds = [
    ...(drain.projectIds ?? []),
    ...(drain.filterV2?.filter?.project?.ids ?? [])
  ]

  return explicitIds.includes(projectId)
}

function traceDrainIsScoped(
  drain: z.infer<typeof drainSchema>,
  projectId: string
) {
  const environments =
    drain.filterV2?.filter?.deployment?.environments ?? []
  const productionOnly =
    environments.length === 1 && environments[0] === 'production'
  const rates = (drain.sampling ?? [])
    .map(sample => Number(sample.rate))
    .filter(Number.isFinite)
  const hasBoundedSampling =
    rates.length > 0 && rates.every(rate => rate >= 0 && rate < 1)

  return (
    appliesToProject(drain, projectId) &&
    productionOnly &&
    hasBoundedSampling
  )
}

async function readDrainHealth(
  input: VercelPlatformHealthInput,
  config: NonNullable<ReturnType<typeof resolveConfig>>
): Promise<IntegrationHealthSnapshot> {
  const parameters = new URLSearchParams({
    includeMetadata: 'true',
    teamId: config.teamId
  })

  try {
    const result = drainsResponseSchema.parse(
      await vercelGet(
        `/v1/drains?${parameters}`,
        config,
        input.fetch
      )
    )
    const enabled = result.drains.filter(
      drain => drain.status === 'enabled'
    )
    const enabledLogDrains = enabled.filter(
      drain => drain.schemas?.log !== undefined
    )
    const enabledTraceDrains = enabled.filter(
      drain => drain.schemas?.trace !== undefined
    )
    const scopedTraceDrains = enabledTraceDrains.filter(drain =>
      traceDrainIsScoped(drain, config.projectId)
    )
    const erroredOrDisabled = result.drains.filter(
      drain => drain.status !== 'enabled'
    ).length
    const healthy =
      enabledLogDrains.length > 0 &&
      enabledTraceDrains.length > 0 &&
      scopedTraceDrains.length === enabledTraceDrains.length
    const resultCode =
      enabledLogDrains.length === 0 ?
        'vercel_log_drain_missing'
      : enabledTraceDrains.length === 0 ?
        'vercel_trace_drain_missing'
      : scopedTraceDrains.length !== enabledTraceDrains.length ?
        'vercel_trace_drain_scope_or_sampling_unsafe'
      : 'vercel_drains_verified'

    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'vercel',
      surface: 'drain_readback',
      status: healthy ? 'healthy' : 'degraded',
      severity: healthy ? 'info' : 'medium',
      checkedAt: input.now().toISOString(),
      sampleCount: Math.max(1, result.drains.length),
      errorCount: healthy ? 0 : 1,
      evidenceLevel: 'provider_receipt',
      providerReceiptStatus: 'verified',
      ...(healthy ?
        {}
      : {
          errorFingerprint: `vercel:drains:${resultCode}`
        }),
      resultCode,
      measurements: {
        enabled_log_drains: enabledLogDrains.length,
        enabled_trace_drains: enabledTraceDrains.length,
        errored_or_disabled_drains: erroredOrDisabled,
        scoped_trace_drains: scopedTraceDrains.length
      }
    })
  } catch {
    return parseIntegrationHealthSnapshot({
      runId: input.runId,
      integration: 'vercel',
      surface: 'drain_readback',
      status: 'degraded',
      severity: 'high',
      checkedAt: input.now().toISOString(),
      sampleCount: 1,
      errorCount: 1,
      evidenceLevel: 'provider_receipt',
      providerReceiptStatus: 'rejected',
      errorFingerprint: 'vercel:drains:readback_failed',
      resultCode: 'vercel_drain_readback_failed',
      safeAction: 'retry_probe_once',
      measurements: {}
    })
  }
}

export async function readVercelPlatformHealth(
  input: VercelPlatformHealthInput
) {
  const config = resolveConfig(input.environment)

  if (!config) {
    return [
      configurationSnapshot(input, 'web_analytics_route_traffic'),
      configurationSnapshot(input, 'drain_readback')
    ]
  }

  return Promise.all([
    readRouteTraffic(input, config),
    readDrainHealth(input, config)
  ])
}
