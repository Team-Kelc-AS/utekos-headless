import {
  captureMetaAdDeliveryInsightsCheckIn
} from '../../../../lib/analytics/server/metaAdDeliveryInsightsSentryMonitor'
import {
  syncMetaAdDeliveryInsights,
  type MetaAdDeliveryInsightsSyncResult
} from '../../../../lib/analytics/server/syncMetaAdDeliveryInsights'
import { hasValidCronAuthorization } from '../../../../lib/security/hasValidCronAuthorization'

export const maxDuration = 60

export type MetaAdDeliveryInsightsCronDependencies = {
  checkIn: typeof captureMetaAdDeliveryInsightsCheckIn
  getCronSecret: () => string | undefined
  sync: () => Promise<MetaAdDeliveryInsightsSyncResult>
}

const defaultDependencies: MetaAdDeliveryInsightsCronDependencies = {
  checkIn: captureMetaAdDeliveryInsightsCheckIn,
  getCronSecret: () => process.env.CRON_SECRET,
  sync: syncMetaAdDeliveryInsights
}

async function safelyCaptureCheckIn(
  dependencies: MetaAdDeliveryInsightsCronDependencies,
  input: Parameters<MetaAdDeliveryInsightsCronDependencies['checkIn']>[0]
) {
  try {
    return await dependencies.checkIn(input)
  } catch {
    return undefined
  }
}

export async function handleMetaAdDeliveryInsightsCron(
  request: Request,
  dependencies: MetaAdDeliveryInsightsCronDependencies =
    defaultDependencies
) {
  const checkInId = await safelyCaptureCheckIn(dependencies, {
    status: 'in_progress'
  })
  let authorized: boolean

  try {
    authorized = hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  } catch (error) {
    if (checkInId) {
      await safelyCaptureCheckIn(dependencies, {
        checkInId,
        status: 'error'
      })
    }
    throw error
  }

  if (!authorized) {
    if (checkInId) {
      await safelyCaptureCheckIn(dependencies, {
        checkInId,
        status: 'error'
      })
    }
    return Response.json(
      { ok: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  let result: MetaAdDeliveryInsightsSyncResult
  try {
    result = await dependencies.sync()
  } catch (error) {
    if (checkInId) {
      await safelyCaptureCheckIn(dependencies, {
        checkInId,
        status: 'error'
      })
    }
    throw error
  }

  if (checkInId) {
    await safelyCaptureCheckIn(dependencies, {
      checkInId,
      status: 'ok'
    })
  }

  return Response.json(
    { ...result, ok: true },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaAdDeliveryInsightsCron(request)
}
