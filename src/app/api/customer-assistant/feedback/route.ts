import { ipAddress } from '@vercel/functions'
import { assistantFeedbackStore } from '@/lib/customer-assistant/server/assistantFeedbackStore'
import { createAssistantFeedbackHandler } from '@/lib/customer-assistant/server/createAssistantFeedbackHandler'
import { createRedisAssistantRateLimiter } from '@/lib/customer-assistant/server/redisAssistantRateLimiter'

const checkRateLimit = createRedisAssistantRateLimiter({
  environment: process.env,
  limit: 30,
  namespace: 'feedback'
})

const handleAssistantFeedback = createAssistantFeedbackHandler({
  checkRateLimit,
  environment: process.env,
  store: assistantFeedbackStore
})

export const maxDuration = 10

export function POST(request: Request) {
  const buyerIp = ipAddress(request)
  return handleAssistantFeedback(
    request,
    buyerIp ? { buyerIp } : undefined
  )
}
