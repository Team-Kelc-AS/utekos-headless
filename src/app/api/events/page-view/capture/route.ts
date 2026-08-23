import { handleCanonicalPageViewRoute } from '@/lib/analytics/server/handleCanonicalPageViewRoute'
import { handleProvisionalPageViewCaptureRequest } from '@/lib/analytics/server/handleProvisionalPageViewCaptureRequest'
import { postgresProvisionalPageViewCaptureStore } from '@/lib/analytics/server/postgresProvisionalPageViewCaptureStore'

export const maxDuration = 60

export function POST(request: Request) {
  return handleCanonicalPageViewRoute(request, {
    collect: currentRequest =>
      handleProvisionalPageViewCaptureRequest(
        currentRequest,
        postgresProvisionalPageViewCaptureStore
      )
  })
}
