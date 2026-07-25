import { ipAddress } from '@vercel/functions'
import { answerAssistantRequest } from '@/lib/customer-assistant/server/answerAssistantRequest'
import {
  createAssistantRouteHandler,
  createProcessLocalAssistantRateLimiter,
  resolveAssistantRequestsPerMinute
} from '@/lib/customer-assistant/server/createAssistantRouteHandler'

const now = () => Date.now()
const checkRateLimit = createProcessLocalAssistantRateLimiter({
  limit: resolveAssistantRequestsPerMinute(
    process.env
  ),
  now
})
const handleAssistantRequest = createAssistantRouteHandler({
  answer: answerAssistantRequest,
  checkRateLimit,
  now
})

export const maxDuration = 30

export function POST(request: Request) {
  const buyerIp = ipAddress(request)

  return handleAssistantRequest(
    request,
    buyerIp ? { buyerIp } : undefined
  )
}
