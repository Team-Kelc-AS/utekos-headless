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

const shippingReturnsOverviewQuestion =
  'Gi en oversikt over frakt og retur hos Utekos.'
const normalizedShippingReturnsOverviewQuestion =
  normalizeAssistantText(shippingReturnsOverviewQuestion)

const returnWindowPattern =
  /\b(?:angrerett(?:en)?|returfrist(?:en)?|fortsatt\s+returnere|returnere\s+etter\s+\d+\s+dager)\b|\bhvor\s+(?:lenge|lang(?:\s+tid)?)[^.!?]{0,80}\b(?:returnere|angre|sende(?:\s+\S+){0,3}\s+tilbake)\b/u
const returnProcessPattern =
  /\b(?:hvordan\s+(?:returnerer|sender)|returnere|returprosess|sende\s+tilbake)\b/u
const deliveryTimePattern =
  /\b(?:leveringstid(?:en)?|levering|leveres|sendes|kommer)\b|\bhvor\s+lang\s+tid[^.!?]{0,80}\bfrakt(?:en)?\b|\bnår[^.!?]{0,80}\bforvente[^.!?]{0,80}\bpakke(?:n)?\b/u
const shippingCostPattern =
  /\b(?:fraktkostnad(?:en)?|porto|koster|kostnad(?:en)?|pris(?:en)?|fri\s+frakt)\b/u

const faqMatchers: ReadonlyArray<{
  id: (typeof shippingReturnsFaqItems)[number]['id']
  pattern: RegExp
}> = [
  {
    id: 'return-exceptions',
    pattern: /\b(?:unntak|forsegling|forseglet|hygiene|brutt)\b/u
  },
  { id: 'return-window', pattern: returnWindowPattern },
  { id: 'return-process', pattern: returnProcessPattern },
  {
    id: 'Merchant-C-Delivery-Time',
    pattern: deliveryTimePattern
  },
  {
    id: 'Merchant-Center-Shopping-Cost',
    pattern: shippingCostPattern
  }
]

function findShippingReturnsFaq(question: string) {
  const normalizedQuestion = normalizeAssistantText(question)
  const matchedId = faqMatchers.find(({ pattern }) =>
    pattern.test(normalizedQuestion)
  )?.id

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
  const normalizedQuestion = normalizeAssistantText(question)

  if (
    intent === 'size_help' &&
    !sizeQuestionPattern.test(normalizedQuestion)
  ) {
    return 'Hvilken størrelse bør jeg velge?'
  }

  if (
    intent === 'shipping_returns' &&
    !findShippingReturnsFaq(normalizedQuestion)
  ) {
    return shippingReturnsOverviewQuestion
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
