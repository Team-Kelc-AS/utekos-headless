import { handleLandingConsentObservationRequest } from '@/lib/analytics/server/handleLandingConsentObservationRequest'
import { classifyBrowserEventTraffic } from '@/lib/analytics/server/classifyBrowserEventTraffic'
import { postgresLandingConsentObservationStore } from '@/lib/analytics/server/postgresLandingConsentObservationStore'
import { verifyLandingEdgeCorrelationToken } from '@/lib/analytics/landingEdgeCorrelationToken'

export const maxDuration = 30

export function POST(request: Request) {
  return handleLandingConsentObservationRequest(request, {
    classifyTraffic: classifyBrowserEventTraffic,
    store: postgresLandingConsentObservationStore,
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
