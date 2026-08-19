import { geolocation, ipAddress } from '@vercel/functions'
import { handleCanonicalWebVitalRequest } from '@/lib/analytics/server/handleCanonicalWebVitalRequest'
import { handleCanonicalWebVitalRoute } from '@/lib/analytics/server/handleCanonicalWebVitalRoute'
import { postgresWebVitalsStore } from '@/lib/analytics/server/postgresWebVitalsStore'

export const maxDuration = 60

export function POST(request: Request) {
  return handleCanonicalWebVitalRoute(request, {
    collect: currentRequest =>
      handleCanonicalWebVitalRequest(currentRequest, {
        getRequestContext: requestWithContext => {
          const geo = geolocation(requestWithContext)
          const clientIpAddress = ipAddress(requestWithContext)
          const userAgent =
            requestWithContext.headers.get('user-agent')

          return {
            ...(geo.city ? { city: geo.city } : {}),
            ...(clientIpAddress ? { clientIpAddress } : {}),
            ...(geo.country ? { countryCode: geo.country } : {}),
            ...(geo.postalCode ?
              { postalCode: geo.postalCode }
            : {}),
            ...(geo.countryRegion ?
              { regionCode: geo.countryRegion }
            : {}),
            ...(userAgent ? { userAgent } : {})
          }
        },
        store: postgresWebVitalsStore
      })
  })
}
