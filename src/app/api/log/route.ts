import { handleClientLogPost } from '@/lib/observability/logging/handleClientLogPost'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

export async function POST(request: Request) {
  return handleClientLogPost(request, { log: logToAppLogs })
}
