
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import {
  getDunWaitlistSyncBackend,
  type DunWaitlistSyncBackend
} from '@/lib/shopify/getDunWaitlistSyncBackend'
import {
  getDunWaitlistShopifyQueueMetrics,
  type DunWaitlistShopifyQueueMetrics
} from '@/lib/shopify/getDunWaitlistShopifyQueueMetrics'
import {
  runDunWaitlistShopifyQueueBatch,
  type DunWaitlistShopifyQueueBatchSummary
} from '@/lib/shopify/runDunWaitlistShopifyQueueBatch'
import {
  runDunWaitlistShopifySyncBatch,
  type DunWaitlistShopifySyncSummary
} from '@/lib/shopify/runDunWaitlistShopifySyncBatch'

const CRON_BATCH_SIZE = 10

export const maxDuration = 60

export type DunWaitlistShopifySyncCronDependencies = {
  getCronSecret: () => string | undefined
  getBackend: () => DunWaitlistSyncBackend
  runLegacyBatch: (input: {
    maxItems: number
  }) => Promise<DunWaitlistShopifySyncSummary>
  runPgmqBatch: (input: {
    maxItems: number
  }) => Promise<DunWaitlistShopifyQueueBatchSummary>
  getQueueMetrics: () => Promise<DunWaitlistShopifyQueueMetrics>
  setBackendTag: (backend: DunWaitlistSyncBackend) => void
}

const defaultDependencies: DunWaitlistShopifySyncCronDependencies = {
  getCronSecret: () => process.env.CRON_SECRET,
  getBackend: getDunWaitlistSyncBackend,
  runLegacyBatch: runDunWaitlistShopifySyncBatch,
  runPgmqBatch: runDunWaitlistShopifyQueueBatch,
  getQueueMetrics: getDunWaitlistShopifyQueueMetrics,
  setBackendTag: () => undefined
}

const noStoreHeaders = {
  'Cache-Control': 'no-store'
} as const

export async function handleDunWaitlistShopifySyncCron(
  request: Request,
  dependencies: DunWaitlistShopifySyncCronDependencies = defaultDependencies
) {
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )

  if (!authorized) {
    return Response.json(
      { ok: false },
      {
        headers: noStoreHeaders,
        status: 401
      }
    )
  }

  let backend: DunWaitlistSyncBackend

  try {
    backend = dependencies.getBackend()
  } catch {
    return Response.json(
      {
        ok: false,
        error: 'invalid_dun_waitlist_sync_backend'
      },
      {
        headers: noStoreHeaders,
        status: 500
      }
    )
  }

  dependencies.setBackendTag(backend)

  if (backend === 'legacy') {
    const summary = await dependencies.runLegacyBatch({
      maxItems: CRON_BATCH_SIZE
    })

    return Response.json(
      {
        ...summary,
        backend: 'legacy' as const,
        ok: true
      },
      { headers: noStoreHeaders }
    )
  }

  const summary = await dependencies.runPgmqBatch({
    maxItems: CRON_BATCH_SIZE
  })

  let queueMetrics: DunWaitlistShopifyQueueMetrics | undefined

  try {
    queueMetrics = await dependencies.getQueueMetrics()
  } catch {
    queueMetrics = undefined
  }

  return Response.json(
    {
      ...summary,
      backend: 'pgmq' as const,
      ok: true,
      ...(queueMetrics !== undefined ? { queueMetrics } : {})
    },
    { headers: noStoreHeaders }
  )
}

export function GET(request: Request) {
  return handleDunWaitlistShopifySyncCron(request)
}
