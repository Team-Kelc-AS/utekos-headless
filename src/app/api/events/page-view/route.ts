import { geolocation, ipAddress } from '@vercel/functions'
import { after } from 'next/server'
import { handleCanonicalPageViewRequest } from '@/lib/analytics/server/handleCanonicalPageViewRequest'
import { handleCanonicalPageViewRoute } from '@/lib/analytics/server/handleCanonicalPageViewRoute'
import { postgresCanonicalPageViewStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'
import { postgresPageViewFunnelObservationStore } from '@/lib/analytics/server/postgresPageViewFunnelObservationStore'
import { postgresProvisionalPageViewCaptureStore } from '@/lib/analytics/server/postgresProvisionalPageViewCaptureStore'

export const maxDuration = 60

export function POST(request: Request) {
  return handleCanonicalPageViewRoute(request, {
    collect: currentRequest =>
      handleCanonicalPageViewRequest(currentRequest, {
        getRequestContext: requestWithContext => {
          const geo = geolocation(requestWithContext)
          const clientIpAddress = ipAddress(requestWithContext)
          const userAgent =
            requestWithContext.headers.get('user-agent')
          const cookieHeader =
            requestWithContext.headers.get('cookie') ?? undefined

          return {
            ...(geo.city ? { city: geo.city } : {}),
            ...(clientIpAddress ? { clientIpAddress } : {}),
            ...(cookieHeader ? { cookieHeader } : {}),
            ...(geo.country ? { countryCode: geo.country } : {}),
            ...(geo.postalCode ?
              { postalCode: geo.postalCode }
            : {}),
            ...(geo.countryRegion ?
              { regionCode: geo.countryRegion }
            : {}),
            requestUrl: requestWithContext.url,
            ...(userAgent ? { userAgent } : {})
          }
        },
        scheduleCollectorReceipt: identity => {
          after(async () => {
            try {
              await postgresPageViewFunnelObservationStore.recordCollectorReceipt(
                identity
              )
            } catch {
              console.warn(
                '[tracking] page_view collector receipt observation failed',
                {
                  event_id: identity.eventId,
                  page_view_id: identity.pageViewId
                }
              )
            }
          })
        },
        provisionalStore:
          postgresProvisionalPageViewCaptureStore,
        store: postgresCanonicalPageViewStore
      })
  })
}
