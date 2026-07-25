import {
  assistantSourceSchema,
  getLastUserText,
  type AssistantChatRequest,
  type AssistantHandoff,
  type AssistantRecommendation,
  type AssistantSource
} from '../assistantProtocol'
import {
  assistantProductsResultSchema,
  commerceRecommendationResultSchema,
  staticCommerceRecommendationAdapter,
  supportKnowledgeResultSchema,
  type AssistantAdapters,
  type AssistantRequestContext
} from './assistantAdapters'
import { matchAssistantProducts } from './matchAssistantProducts'
import { resolveAssistantClarification } from './resolveAssistantClarification'
import { resolveAssistantHandoff } from './resolveAssistantHandoff'
import { resolveAssistantStockAvailability } from './resolveAssistantStockAvailability'
import { fetchAssistantProducts } from './shopifyAssistantCatalog'
import {
  resolveSupportKnowledgeQuestion,
  staticSupportKnowledgeAdapter
} from './staticSupportKnowledge'

export type AssistantOutcome = {
  text: string
  confidence: 'high' | 'medium' | 'low'
  recommendations: AssistantRecommendation[]
  sources: AssistantSource[]
  handoff: AssistantHandoff | null
  failureCode:
    | 'none'
    | 'shopify_unavailable'
    | 'knowledge_unavailable'
    | 'recommendation_unavailable'
    | 'no_grounded_answer'
}

const defaultAdapters: AssistantAdapters = {
  fetchProducts: fetchAssistantProducts,
  supportKnowledge: staticSupportKnowledgeAdapter,
  commerceRecommendation: staticCommerceRecommendationAdapter
}

function createHandoff(
  reason: AssistantHandoff['reason']
): AssistantHandoff {
  return {
    contactPath: '/kontaktskjema',
    email: 'kundeservice@utekos.no',
    phone: '+4740216343',
    reason
  }
}

const SAFE_SUPPORT_KNOWLEDGE_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'INTERNAL',
  'PERMISSION_DENIED',
  'UNAUTHENTICATED',
  'UNAVAILABLE',
  'UNKNOWN'
])

function getSafeSupportKnowledgeFailureCode(error: unknown) {
  if (
    !error ||
    typeof error !== 'object' ||
    !('code' in error)
  ) {
    return 'unknown'
  }

  const code = error.code

  if (
    typeof code === 'number' &&
    Number.isInteger(code) &&
    code >= 0 &&
    code <= 16
  ) {
    return code
  }

  if (
    typeof code === 'string' &&
    SAFE_SUPPORT_KNOWLEDGE_ERROR_CODES.has(code)
  ) {
    return code
  }

  return 'unknown'
}

function safeFailure(
  failureCode: Extract<
    AssistantOutcome['failureCode'],
    'shopify_unavailable' | 'knowledge_unavailable'
  >
): AssistantOutcome {
  return {
    text:
      failureCode === 'shopify_unavailable' ?
        'Jeg fikk ikke kontrollert produktinformasjonen akkurat nå. Kundeservice kan hjelpe deg videre.'
      : 'Jeg fikk ikke hentet et sikkert svar. Kundeservice kan hjelpe deg videre.',
    confidence: 'low',
    recommendations: [],
    sources: [],
    handoff: createHandoff('uncertain'),
    failureCode
  }
}

function noGroundedAnswer(): AssistantOutcome {
  return {
    text: 'Jeg fant ikke et sikkert svar i det godkjente Utekos-innholdet. Kundeservice kan hjelpe deg videre.',
    confidence: 'low',
    recommendations: [],
    sources: [],
    handoff: createHandoff('uncertain'),
    failureCode: 'no_grounded_answer'
  }
}

function clarificationExhausted(): AssistantOutcome {
  return {
    text: 'Jeg har ikke nok sikre opplysninger til å anbefale et produkt. Kundeservice kan hjelpe deg videre.',
    confidence: 'low',
    recommendations: [],
    sources: [],
    handoff: createHandoff('uncertain'),
    failureCode: 'no_grounded_answer'
  }
}

function getAllUserText(
  messages: AssistantChatRequest['messages']
) {
  return messages
    .filter(message => message.role === 'user')
    .flatMap(message => message.parts.map(part => part.text))
    .join('\n')
    .trim()
}

function resolveRequestHandoff(
  messages: AssistantChatRequest['messages'],
  failureCount: number
) {
  for (const message of messages) {
    if (message.role !== 'user') {
      continue
    }

    const reason = resolveAssistantHandoff(
      message.parts
        .map(part => part.text)
        .join('\n')
        .trim(),
      0
    )

    if (reason) {
      return reason
    }
  }

  return resolveAssistantHandoff('', failureCount)
}

function createCatalogInput(
  context: AssistantRequestContext,
  handles?: string[]
) {
  return {
    ...(context.buyerIp ? { buyerIp: context.buyerIp } : {}),
    ...(handles ? { handles } : {})
  }
}

function reorderEligibleAlternatives(
  recommendations: AssistantRecommendation[],
  recommendedProductIds: string[]
): AssistantRecommendation[] {
  const [primary, ...alternatives] = recommendations

  if (!primary || alternatives.length === 0) {
    return recommendations
  }

  const orderById = new Map(
    recommendedProductIds.map((id, index) => [id, index])
  )
  const reordered = alternatives.toSorted((left, right) => {
    const leftOrder = orderById.get(left.product.id)
    const rightOrder = orderById.get(right.product.id)

    return (
      (leftOrder ?? Number.MAX_SAFE_INTEGER) -
      (rightOrder ?? Number.MAX_SAFE_INTEGER)
    )
  })

  return [primary, ...reordered].map(
    (recommendation, index) => ({
      ...recommendation,
      rank: (index + 1) as 1 | 2 | 3,
      isPrimary: index === 0
    })
  )
}

async function answerProductHelp(
  request: AssistantChatRequest,
  context: AssistantRequestContext,
  adapters: AssistantAdapters
): Promise<AssistantOutcome> {
  const clarification = resolveAssistantClarification(
    request.messages
  )

  if (clarification.kind === 'ask') {
    return {
      text: clarification.question,
      confidence: 'medium',
      recommendations: [],
      sources: [],
      handoff: null,
      failureCode: 'none'
    }
  }

  if (clarification.kind === 'exhausted') {
    return clarificationExhausted()
  }

  let products

  try {
    products = assistantProductsResultSchema.parse(
      await adapters.fetchProducts(createCatalogInput(context))
    )
  } catch {
    return safeFailure('shopify_unavailable')
  }

  const recommendations = matchAssistantProducts({
    products,
    lastUserText: getAllUserText(request.messages),
    intent: request.intent,
    currentProductHandle: request.pageContext.productHandle
  })

  if (recommendations.length === 0) {
    return noGroundedAnswer()
  }

  const primaryRecommendation = recommendations[0]

  if (!primaryRecommendation) {
    return noGroundedAnswer()
  }

  try {
    const providerProductIds =
      commerceRecommendationResultSchema.parse(
        await adapters.commerceRecommendation.recommend({
          productIds: recommendations.map(
            recommendation => recommendation.product.id
          ),
          sessionId: request.sessionId
        })
      )
    const rankedRecommendations = reorderEligibleAlternatives(
      recommendations,
      providerProductIds
    )
    const rankedPrimary =
      rankedRecommendations[0] ?? primaryRecommendation

    return {
      text: `Jeg anbefaler ${rankedPrimary.product.title} ut fra det du har fortalt.`,
      confidence: 'high',
      recommendations: rankedRecommendations,
      sources: [],
      handoff: null,
      failureCode: 'none'
    }
  } catch {
    return {
      text: `Jeg anbefaler ${primaryRecommendation.product.title} ut fra det du har fortalt.`,
      confidence: 'high',
      recommendations,
      sources: [],
      handoff: null,
      failureCode: 'recommendation_unavailable'
    }
  }
}

async function answerStockHelp(
  request: AssistantChatRequest,
  context: AssistantRequestContext,
  adapters: AssistantAdapters
): Promise<AssistantOutcome> {
  const productHandle = request.pageContext.productHandle

  if (!productHandle) {
    return noGroundedAnswer()
  }

  try {
    const products = assistantProductsResultSchema.parse(
      await adapters.fetchProducts(
        createCatalogInput(context, [productHandle])
      )
    )
    const product = products.find(
      candidate => candidate.handle === productHandle
    )

    if (!product) {
      return noGroundedAnswer()
    }

    const availability = resolveAssistantStockAvailability(
      product,
      request.messages
    )

    if (availability.kind === 'clarify') {
      return {
        text: 'Hvilken størrelse, farge eller variant vil du sjekke?',
        confidence: 'medium',
        recommendations: [],
        sources: [],
        handoff: null,
        failureCode: 'none'
      }
    }

    const source = assistantSourceSchema.parse({
      title: 'Produktside',
      url: `https://utekos.no/produkter/${product.handle}`
    })

    return {
      text:
        availability.kind === 'variant' ?
          `${product.title} i ${availability.label} er ${availability.availableForSale ? 'tilgjengelig' : 'ikke tilgjengelig'}.`
        : `${product.title} er ${availability.availableForSale ? 'tilgjengelig' : 'ikke tilgjengelig'}.`,
      confidence: 'high',
      recommendations: [],
      sources: [source],
      handoff: null,
      failureCode: 'none'
    }
  } catch {
    return safeFailure('shopify_unavailable')
  }
}

async function answerSupportQuestion(
  request: AssistantChatRequest,
  adapters: AssistantAdapters
): Promise<AssistantOutcome> {
  try {
    const question = resolveSupportKnowledgeQuestion({
      intent: request.intent,
      question: getLastUserText(request.messages)
    })
    const result = supportKnowledgeResultSchema.parse(
      await adapters.supportKnowledge.answer({
        question,
        productHandle: request.pageContext.productHandle
      })
    )

    if (
      result.confidence === 'low' ||
      result.sources.length === 0
    ) {
      return noGroundedAnswer()
    }

    return {
      text: result.text,
      confidence: result.confidence,
      recommendations: [],
      sources: result.sources,
      handoff: null,
      failureCode: 'none'
    }
  } catch (error) {
    console.warn(
      'customer_assistant_support_knowledge_failure',
      { code: getSafeSupportKnowledgeFailureCode(error) }
    )
    return safeFailure('knowledge_unavailable')
  }
}

export async function answerAssistantRequest(
  request: AssistantChatRequest,
  context: AssistantRequestContext,
  adapters: AssistantAdapters = defaultAdapters
): Promise<AssistantOutcome> {
  const restrictedReason = resolveRequestHandoff(
    request.messages,
    context.failureCount
  )

  if (restrictedReason) {
    return {
      text: 'Dette må kundeservice hjelpe deg med. Velg kontaktmåten som passer best.',
      confidence: 'high',
      recommendations: [],
      sources: [],
      handoff: createHandoff(restrictedReason),
      failureCode: 'none'
    }
  }

  if (request.intent === 'product_help') {
    return answerProductHelp(request, context, adapters)
  }

  if (request.intent === 'stock_help') {
    return answerStockHelp(request, context, adapters)
  }

  return answerSupportQuestion(request, adapters)
}
