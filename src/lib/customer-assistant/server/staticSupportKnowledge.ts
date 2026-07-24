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

const faqMatchers: ReadonlyArray<{
  id: (typeof shippingReturnsFaqItems)[number]['id']
  pattern: RegExp
}> = [
  {
    id: 'return-exceptions',
    pattern: /\b(?:unntak|forsegling|forseglet|hygiene|brutt)\b/u
  },
  {
    id: 'return-window',
    pattern:
      /\b(?:angrerett|returfrist)\b|\bhvor\s+lenge(?:\s+\S+){0,5}\s+(?:returnere|angre)\b/u
  },
  {
    id: 'return-process',
    pattern:
      /\b(?:hvordan\s+(?:returnerer|sender)|returnere|returprosess|sende\s+tilbake)\b/u
  },
  {
    id: 'Merchant-C-Delivery-Time',
    pattern:
      /\b(?:leveringstid(?:en)?|levering|leveres|sendes|kommer)\b/u
  },
  {
    id: 'Merchant-Center-Shopping-Cost',
    pattern: /\b(?:frakt|fraktkostnad|porto|koster)\b/u
  }
]

function findShippingReturnsFaq(question: string) {
  const normalizedQuestion = normalizeAssistantText(question)
  const matchedId = faqMatchers.find(({ pattern }) =>
    pattern.test(normalizedQuestion)
  )?.id
  const fallbackId =
    /\b(?:retur|returnere)\b/u.test(normalizedQuestion) ?
      'return-process'
    : null

  return shippingReturnsFaqItems.find(
    item => item.id === (matchedId ?? fallbackId)
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
    return 'Hva koster frakten hos Utekos?'
  }

  return question
}

function answerShippingReturns(
  question: string
): SupportKnowledgeResult | null {
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
