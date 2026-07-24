import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
import {
  assistantSourceSchema,
  type AssistantIntent
} from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'
import type {
  SupportKnowledgeAdapter,
  SupportKnowledgeResult
} from './assistantAdapters'

const shippingReturnsSource = assistantSourceSchema.parse({
  title: 'Frakt og retur',
  url: 'https://utekos.no/frakt-og-retur'
})

const sizeGuideSource = assistantSourceSchema.parse({
  title: 'Størrelsesguide',
  url: 'https://utekos.no/handlehjelp/storrelsesguide'
})

const sizeQuestionPattern =
  /\b(?:størrelse|størrelsen|størrelsesguide|passform|mål)\b/u
const canonicalSizeQuestion = 'Hvilken størrelse bør jeg velge?'

const shippingReturnsOverviewQuestion =
  'Gi en oversikt over frakt og retur hos Utekos.'
const normalizedShippingReturnsOverviewQuestion =
  normalizeAssistantText(shippingReturnsOverviewQuestion)

type ShippingReturnsFaqId =
  (typeof shippingReturnsFaqItems)[number]['id']

function classifyShippingReturnsQuestion(
  normalizedQuestion: string
): ShippingReturnsFaqId | null {
  const hasReturnContext =
    /\b(?:retur(?:en)?|returner(?:e|er|t)?|tilbake|angrerett(?:en)?)\b/u.test(
      normalizedQuestion
    )
  const hasCanonicalReturnWindow = /\bangrerett(?:en)?\b/u.test(
    normalizedQuestion
  )
  const hasReturnDeadlineContext =
    /\b(?:hvor\s+(?:mange\s+dager|lang\s+tid|lenge)|frist(?:en)?|har\s+jeg\s+på\s+å|(?:etter|innen)\s+\d+\s+dager)\b/u.test(
      normalizedQuestion
    ) ||
    /\bnår\b[^.!?]{0,80}\bsenest\b/u.test(normalizedQuestion)
  const hasReturnProcessContext =
    /\b(?:hvordan|fremgangsmåte(?:n)?|returprosess(?:en)?|måte(?:n)?)\b/u.test(
      normalizedQuestion
    )
  const hasDeliveryContext =
    /\b(?:levering(?:en)?|leveringstid(?:en)?|frakt(?:en)?|pakke(?:n)?)\b/u.test(
      normalizedQuestion
    )
  const hasDeliveryTimingContext =
    /\b(?:hvor\s+(?:mange\s+dager|lang\s+tid|lenge)|når|forvente|leveringstid(?:en)?|kommer)\b/u.test(
      normalizedQuestion
    )
  const hasShippingCostContext =
    /\b(?:fraktkostnad(?:en)?|porto|koster|kostnad(?:en)?|pris(?:en)?|fri\s+frakt)\b/u.test(
      normalizedQuestion
    )
  const hasReturnExceptionContext =
    /\b(?:unntak|forsegling|forseglet|hygiene|brutt)\b/u.test(
      normalizedQuestion
    )

  if (hasReturnContext && hasReturnExceptionContext) {
    return 'return-exceptions'
  }

  if (hasReturnContext && hasShippingCostContext) {
    return 'return-window'
  }

  if (hasReturnContext && hasReturnProcessContext) {
    return 'return-process'
  }

  if (
    hasCanonicalReturnWindow ||
    (hasReturnContext && hasReturnDeadlineContext)
  ) {
    return 'return-window'
  }

  if (hasDeliveryContext && hasDeliveryTimingContext) {
    return 'Merchant-C-Delivery-Time'
  }

  if (hasDeliveryContext && hasShippingCostContext) {
    return 'Merchant-Center-Shopping-Cost'
  }

  return null
}

function findShippingReturnsFaq(question: string) {
  const normalizedQuestion = normalizeAssistantText(question)
  const matchedId = classifyShippingReturnsQuestion(
    normalizedQuestion
  )

  return shippingReturnsFaqItems.find(
    item => item.id === matchedId
  )
}

export function resolveSupportKnowledgeQuestion({
  intent,
  question
}: {
  intent: AssistantIntent
  question: string
}) {
  if (intent === 'size_help') {
    return canonicalSizeQuestion
  }

  if (intent === 'shipping_returns') {
    return (
      findShippingReturnsFaq(question)?.question ??
      shippingReturnsOverviewQuestion
    )
  }

  return question
}

function answerShippingReturns(
  question: string
): SupportKnowledgeResult | null {
  if (
    normalizeAssistantText(question) ===
    normalizedShippingReturnsOverviewQuestion
  ) {
    return {
      text: shippingReturnsFaqItems
        .map(item => `${item.question} ${item.answer}`)
        .join('\n\n'),
      confidence: 'high',
      sources: [shippingReturnsSource]
    }
  }

  const faqItem = findShippingReturnsFaq(question)

  return faqItem ?
      {
        text: faqItem.answer,
        confidence: 'high',
        sources: [shippingReturnsSource]
      }
    : null
}

function answerSize(
  question: string
): SupportKnowledgeResult | null {
  const normalizedQuestion = normalizeAssistantText(question)

  if (!sizeQuestionPattern.test(normalizedQuestion)) {
    return null
  }

  return {
    text: 'Jeg kan ikke garantere hvilken størrelse som passer. Sammenlign målene for det aktuelle produktet med et lignende plagg du har hjemme, og bruk størrelsesguiden som veiledning.',
    confidence: 'high',
    sources: [sizeGuideSource]
  }
}

function lowConfidenceResult(): SupportKnowledgeResult {
  return {
    text: 'Jeg fant ikke et sikkert svar i det godkjente Utekos-innholdet.',
    confidence: 'low',
    sources: []
  }
}

export const staticSupportKnowledgeAdapter: SupportKnowledgeAdapter =
  {
    async answer({ question }) {
      return (
        answerSize(question) ??
        answerShippingReturns(question) ??
        lowConfidenceResult()
      )
    }
  }
