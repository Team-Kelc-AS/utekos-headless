import { ipAddress } from '@vercel/functions'
import { answerAssistantRequest } from '@/lib/customer-assistant/server/answerAssistantRequest'
import {
  staticCommerceRecommendationAdapter,
  type AssistantAdapters,
  type SupportKnowledgeAdapter
} from '@/lib/customer-assistant/server/assistantAdapters'
import {
  createAssistantRouteHandler,
  createProcessLocalAssistantRateLimiter,
  resolveAssistantRequestsPerMinute
} from '@/lib/customer-assistant/server/createAssistantRouteHandler'
import { fetchAssistantProducts } from '@/lib/customer-assistant/server/shopifyAssistantCatalog'
import {
  DiscoverySupportKnowledge,
  readDiscoverySupportKnowledgeConfig
} from '@/lib/google/customer-assistant/discoverySupportKnowledge'

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
      new DiscoverySupportKnowledge(environment)
  }

export function createCustomerAssistantAnswer(
  environment: Environment = process.env,
  dependencies: CustomerAssistantAnswerDependencies = defaultAnswerDependencies
): typeof answerAssistantRequest {
  try {
    readDiscoverySupportKnowledgeConfig(environment)
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
const checkRateLimit = createProcessLocalAssistantRateLimiter({
  limit: resolveAssistantRequestsPerMinute(process.env),
  now
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
