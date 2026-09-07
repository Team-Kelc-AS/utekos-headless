import { classifyBrowserEventTraffic } from '@/lib/analytics/server/classifyBrowserEventTraffic'
import { handleJourneyRequest } from '@/lib/observability/journey/handleJourneyRequest'
import { postgresJourneyStore } from '@/lib/observability/journey/postgresJourneyStore'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'

export const maxDuration = 15

export function POST(request: Request) {
  return handleJourneyRequest(request, {
    store: postgresJourneyStore,
    now: Date.now,
    runtime: getVercelRuntimeContext(),
    classifyTraffic: classifyBrowserEventTraffic
  })
}
