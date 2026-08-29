import { handleClientLogPost } from '@/lib/observability/logging/handleClientLogPost'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

export async function POST(request: Request) {
  return handleClientLogPost(request, {
    authorizeHealthProbe: currentRequest =>
      hasValidCronAuthorization(
        currentRequest.headers.get('authorization'),
        process.env.CRON_SECRET
      ),
    log: logToAppLogs
  })
}
