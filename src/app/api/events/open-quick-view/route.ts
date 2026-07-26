import { geolocation, ipAddress } from '@vercel/functions'
import { handleCanonicalOpenQuickViewRequest } from '@/lib/analytics/server/handleCanonicalOpenQuickViewRequest'
import { handleCanonicalOpenQuickViewRoute } from '@/lib/analytics/server/handleCanonicalOpenQuickViewRoute'
import { postgresCanonicalEventStore } from '@/lib/analytics/server/postgresCanonicalPageViewStore'

export const maxDuration = 60

export function POST(request: Request) {
  return handleCanonicalOpenQuickViewRoute(request, {
    collect: currentRequest =>
      handleCanonicalOpenQuickViewRequest(currentRequest, {
        getRequestContext: requestWithContext => {
          const geo = geolocation(requestWithContext)
          const clientIpAddress = ipAddress(requestWithContext)
          const userAgent = requestWithContext.headers.get('user-agent')

          return {
            ...(geo.city ? { city: geo.city } : {}),
            ...(clientIpAddress ? { clientIpAddress } : {}),
            ...(geo.country ? { countryCode: geo.country } : {}),
            ...(geo.postalCode ? { postalCode: geo.postalCode } : {}),
            ...(geo.countryRegion ? { regionCode: geo.countryRegion } : {}),
            ...(userAgent ? { userAgent } : {})
          }
        },
        store: postgresCanonicalEventStore
      })
  })
}
