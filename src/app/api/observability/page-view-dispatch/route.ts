import { verifyLandingEdgeCorrelationToken } from '@/lib/analytics/landingEdgeCorrelationToken'
import { classifyBrowserEventTraffic } from '@/lib/analytics/server/classifyBrowserEventTraffic'
import { handlePageViewDispatchObservationRequest } from '@/lib/analytics/server/handlePageViewDispatchObservationRequest'
import { postgresPageViewFunnelObservationStore } from '@/lib/analytics/server/postgresPageViewFunnelObservationStore'

export const maxDuration = 30

export function POST(request: Request) {
  return handlePageViewDispatchObservationRequest(request, {
    classifyTraffic: classifyBrowserEventTraffic,
    store: postgresPageViewFunnelObservationStore,
    verifyCorrelation: ({ edgeRequestId, token }) => {
      const secret =
        process.env.LANDING_OBSERVABILITY_SIGNING_SECRET?.trim()
      if (!secret) {
        throw new Error(
          'Missing LANDING_OBSERVABILITY_SIGNING_SECRET'
        )
      }

      return verifyLandingEdgeCorrelationToken({
        edgeRequestId,
        nowSeconds: Math.floor(Date.now() / 1000),
        secret,
        token
      })
    }
  })
}
