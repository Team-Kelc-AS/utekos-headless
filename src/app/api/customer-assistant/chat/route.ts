import { ipAddress } from '@vercel/functions'
import { answerAssistantRequest } from '@/lib/customer-assistant/server/answerAssistantRequest'
import {
  createAssistantRouteHandler,
  createProcessLocalAssistantRateLimiter
} from '@/lib/customer-assistant/server/createAssistantRouteHandler'

const PREVIEW_REQUESTS_PER_MINUTE = 12
const PRODUCTION_REQUESTS_PER_MINUTE = 0
const now = () => Date.now()
const checkRateLimit = createProcessLocalAssistantRateLimiter({
  limit:
    process.env.VERCEL_ENV === 'production' ?
      PRODUCTION_REQUESTS_PER_MINUTE
    : PREVIEW_REQUESTS_PER_MINUTE,
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
