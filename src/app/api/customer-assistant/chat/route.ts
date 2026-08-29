import { ipAddress } from '@vercel/functions'
import { answerAssistantRequest } from '@/lib/customer-assistant/server/answerAssistantRequest'
import {
  staticCommerceRecommendationAdapter,
  type AssistantAdapters,
  type SupportKnowledgeAdapter
} from '@/lib/customer-assistant/server/assistantAdapters'
import {
  createAssistantRouteHandler,
  resolveAssistantRequestsPerMinute
} from '@/lib/customer-assistant/server/createAssistantRouteHandler'
import { createRedisAssistantRateLimiter } from '@/lib/customer-assistant/server/redisAssistantRateLimiter'
import { fetchAssistantProducts } from '@/lib/customer-assistant/server/shopifyAssistantCatalog'
import {
  GeminiSupportKnowledge,
  readGeminiSupportKnowledgeConfig
} from '@/lib/google/customer-assistant/geminiSupportKnowledge'

type Environment = Readonly<Record<string, string | undefined>>

export type CustomerAssistantAnswerDependencies = {
  answer: typeof answerAssistantRequest
  createSupportKnowledge: (
    environment: Environment
  ) => SupportKnowledgeAdapter
}

const defaultAnswerDependencies: CustomerAssistantAnswerDependencies =
  {
    answer: answerAssistantRequest,
    createSupportKnowledge: environment =>
      new GeminiSupportKnowledge(environment)
  }

export function createCustomerAssistantAnswer(
  environment: Environment = process.env,
  dependencies: CustomerAssistantAnswerDependencies = defaultAnswerDependencies
): typeof answerAssistantRequest {
  try {
    readGeminiSupportKnowledgeConfig(environment)
  } catch {
    return dependencies.answer
  }

  let supportKnowledge: SupportKnowledgeAdapter

  try {
    supportKnowledge =
      dependencies.createSupportKnowledge(environment)
  } catch {
    return dependencies.answer
  }

  const adapters: AssistantAdapters = {
    commerceRecommendation: staticCommerceRecommendationAdapter,
    fetchProducts: fetchAssistantProducts,
    supportKnowledge
  }

  return (request, context) =>
    dependencies.answer(request, context, adapters)
}

const now = () => Date.now()
const checkRateLimit = createRedisAssistantRateLimiter({
  environment: process.env,
  limit: resolveAssistantRequestsPerMinute(process.env),
  namespace: 'chat'
})
const answerCustomerAssistantRequest =
  createCustomerAssistantAnswer()
const handleAssistantRequest = createAssistantRouteHandler({
  answer: answerCustomerAssistantRequest,
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
