import 'server-only'

import { evaluateProviderDispatchHealth } from '@/lib/analytics/server/providerDispatchHealth'
import { postgresProviderDispatchHealthStore } from '@/lib/analytics/server/postgresProviderDispatchHealthStore'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import type { IntegrationHealthSnapshot } from './integrationHealthSnapshot'
import { mapProviderDispatchHealth } from './mapProviderDispatchHealth'
import { readCanonicalLedgerHealth } from './readCanonicalLedgerHealth'
import { readIntegrationConfigurationHealth } from './readIntegrationConfigurationHealth'
import {
  runSyntheticProductionProbes,
  SYNTHETIC_PRODUCTION_PROBE_SURFACES
} from './syntheticProductionProbes'
import { readVercelPlatformHealth } from './vercelPlatformHealth'

type Environment = Readonly<Record<string, string | undefined>>
type FetchLike = typeof fetch

type Dependencies = {
  environment: Environment
  fetch: FetchLike
  now: () => Date
  readLedger: typeof readCanonicalLedgerHealth
  readProviderSnapshot:
    typeof postgresProviderDispatchHealthStore.readSnapshot
  readVercel: typeof readVercelPlatformHealth
  runSynthetic: typeof runSyntheticProductionProbes
}

const defaultDependencies: Dependencies = {
  environment: process.env,
  fetch,
  now: () => new Date(),
  readLedger: readCanonicalLedgerHealth,
  readProviderSnapshot: () =>
    postgresProviderDispatchHealthStore.readSnapshot(),
  readVercel: readVercelPlatformHealth,
  runSynthetic: runSyntheticProductionProbes
}

async function readProviderHealth(
  runId: string,
  dependencies: Dependencies
) {
  const checkedAt = dependencies.now().toISOString()
  try {
    const evaluation = evaluateProviderDispatchHealth(
      await dependencies.readProviderSnapshot()
    )
    return [
      parseIntegrationHealthSnapshot({
        runId,
        integration: 'canonical_provider_dispatch',
        surface: 'health_readback',
        status: 'healthy',
        severity: 'info',
        checkedAt,
        sampleCount: 1,
        errorCount: 0,
        evidenceLevel: 'internal_ledger',
        providerReceiptStatus: 'not_applicable',
        resultCode: 'provider_health_readback_succeeded',
        measurements: {}
      }),
      ...mapProviderDispatchHealth({
        checkedAt,
        evaluation,
        runId
      })
    ]
  } catch {
    return [
      parseIntegrationHealthSnapshot({
        runId,
        integration: 'canonical_provider_dispatch',
        surface: 'health_readback',
        status: 'unhealthy',
        severity: 'high',
        checkedAt,
        sampleCount: 1,
        errorCount: 1,
        evidenceLevel: 'internal_ledger',
        providerReceiptStatus: 'rejected',
        errorFingerprint: 'provider_dispatch:health_readback_failed',
        resultCode: 'provider_health_readback_failed',
        safeAction: 'retry_probe_once',
        measurements: {}
      })
    ]
  }
}

function routePageviews(
  snapshots: readonly IntegrationHealthSnapshot[]
) {
  const value = snapshots.find(
    snapshot =>
      snapshot.integration === 'vercel' &&
      snapshot.surface === 'web_analytics_route_traffic' &&
      snapshot.status === 'healthy'
  )?.measurements.pageviews

  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ?
      value
    : null
}

export async function collectInitialLaunchGuardHealth(
  input: {
    cronSecret: string
    origin: string
    runId: string
  },
  dependencies: Dependencies = defaultDependencies
) {
  const [synthetic, vercel, provider] = await Promise.all([
    dependencies.runSynthetic({
      cronSecret: input.cronSecret,
      fetch: dependencies.fetch,
      now: dependencies.now,
      origin: input.origin,
      runId: input.runId
    }),
    dependencies.readVercel({
      environment: dependencies.environment,
      fetch: dependencies.fetch,
      now: dependencies.now,
      runId: input.runId
    }),
    readProviderHealth(input.runId, dependencies)
  ])
  const ledger = await dependencies.readLedger({
    now: dependencies.now,
    routePageviews: routePageviews(vercel),
    runId: input.runId
  })
  const configuration = readIntegrationConfigurationHealth({
    environment: dependencies.environment,
    now: dependencies.now,
    runId: input.runId
  })

  return [...synthetic, ...vercel, ledger, ...provider, ...configuration]
}

function key(snapshot: IntegrationHealthSnapshot) {
  return `${snapshot.integration}:${snapshot.surface}`
}

export function replaceRetriedSnapshots(
  initial: readonly IntegrationHealthSnapshot[],
  retried: readonly IntegrationHealthSnapshot[]
) {
  const replacements = new Map(
    retried.map(snapshot => [key(snapshot), snapshot])
  )

  return initial.map(snapshot => {
    const replacement = replacements.get(key(snapshot))
    if (!replacement) return snapshot
    const { safeAction: _safeAction, ...withoutSafeAction } =
      replacement

    return parseIntegrationHealthSnapshot({
      ...withoutSafeAction,
      measurements: {
        ...replacement.measurements,
        initial_result_code: snapshot.resultCode,
        retry_attempted: true
      }
    })
  })
}

export async function retryLaunchGuardFailures(
  input: {
    cronSecret: string
    initial: readonly IntegrationHealthSnapshot[]
    origin: string
    runId: string
  },
  dependencies: Dependencies = defaultDependencies
) {
  const retryable = input.initial.filter(
    snapshot => snapshot.safeAction === 'retry_probe_once'
  )
  if (retryable.length === 0) return [...input.initial]

  const retried: IntegrationHealthSnapshot[] = []
  const knownSyntheticSurfaces = new Set<string>(
    SYNTHETIC_PRODUCTION_PROBE_SURFACES
  )
  const syntheticSurfaces = new Set(
    retryable
      .filter(snapshot =>
        knownSyntheticSurfaces.has(snapshot.surface)
      )
      .map(snapshot => snapshot.surface)
  )
  if (syntheticSurfaces.size > 0) {
    retried.push(
      ...(await dependencies.runSynthetic(
        {
          cronSecret: input.cronSecret,
          fetch: dependencies.fetch,
          now: dependencies.now,
          origin: input.origin,
          runId: input.runId
        },
        syntheticSurfaces
      ))
    )
  }

  const retryVercel = retryable.some(
    snapshot =>
      snapshot.integration === 'vercel' &&
      (
        snapshot.surface === 'web_analytics_route_traffic' ||
        snapshot.surface === 'drain_readback'
      )
  )
  let vercelRetry: IntegrationHealthSnapshot[] = []
  if (retryVercel) {
    vercelRetry = await dependencies.readVercel({
      environment: dependencies.environment,
      fetch: dependencies.fetch,
      now: dependencies.now,
      runId: input.runId
    })
    const surfaces = new Set(
      retryable
        .filter(
          snapshot =>
            snapshot.integration === 'vercel' &&
            (
              snapshot.surface === 'web_analytics_route_traffic' ||
              snapshot.surface === 'drain_readback'
            )
        )
        .map(snapshot => snapshot.surface)
    )
    retried.push(
      ...vercelRetry.filter(snapshot => surfaces.has(snapshot.surface))
    )
  }

  if (
    retryable.some(
      snapshot =>
        snapshot.integration === 'supabase' &&
        snapshot.surface === 'skreddersy_varmen_ledger_freshness'
    )
  ) {
    const effective = replaceRetriedSnapshots(
      input.initial,
      vercelRetry
    )
    retried.push(
      await dependencies.readLedger({
        now: dependencies.now,
        routePageviews: routePageviews(effective),
        runId: input.runId
      })
    )
  }

  if (
    retryable.some(
      snapshot =>
        snapshot.integration === 'canonical_provider_dispatch' &&
        snapshot.surface === 'health_readback'
    )
  ) {
    retried.push(...(await readProviderHealth(input.runId, dependencies)))
  }

  return replaceRetriedSnapshots(input.initial, retried)
}
