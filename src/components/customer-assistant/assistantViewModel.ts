import {
  assistantSourceSchema,
  type AssistantHandoff,
  type AssistantRecommendation,
  type AssistantSource,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { z } from 'zod'

const MAX_SUMMARY_CHARACTERS = 1_000
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu
const PAYMENT_NUMBER_PATTERN =
  /(?<![\p{L}\p{N}])(?:\d[\s-]?){12,18}\d(?![\p{L}\p{N}])/gu
const ORDER_NUMBER_PATTERN =
  /\b(?:ord(?:er)?|ordre(?:nummer|nr)?|bestilling(?:snummer|snr)?)[\s:#-]*[A-Z0-9-]{4,}\b/giu
const HASHED_NUMBER_PATTERN =
  /(?<![\p{L}\p{N}])#[A-Z0-9-]{4,}\b/giu
const PHONE_NUMBER_PATTERN =
  /(?<![\p{L}\p{N}])\+?(?:\d[\s().-]?){6,14}\d(?![\p{L}\p{N}])/gu
const REDACTION = '[opplysning fjernet]'

const imageSchema = z
  .strictObject({
    alt: z.string().trim().min(1).max(200),
    url: z.string().url()
  })
  .refine(
    image =>
      new URL(image.url).origin === 'https://cdn.shopify.com',
    'Product images must use the Shopify CDN origin'
  )

const productSchema = z.strictObject({
  id: z.string().min(1).max(200),
  handle: z.string().regex(HANDLE_PATTERN).max(160),
  title: z.string().trim().min(1).max(200),
  href: z.string().startsWith('/produkter/').max(220),
  image: imageSchema.nullable(),
  price: z.strictObject({
    amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/u),
    currencyCode: z.string().regex(/^[A-Z]{3}$/u)
  }),
  variants: z
    .array(
      z.strictObject({
        id: z.string().min(1).max(200),
        title: z.string().trim().min(1).max(160),
        availableForSale: z.boolean(),
        selectedOptions: z
          .array(
            z.strictObject({
              name: z.string().trim().min(1).max(80),
              value: z.string().trim().min(1).max(100)
            })
          )
          .max(6)
      })
    )
    .max(50)
})

const recommendationSchema = z.strictObject({
  product: productSchema,
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason: z.string().trim().min(1).max(500),
  isPrimary: z.boolean()
})

const handoffSchema = z.strictObject({
  contactPath: z.literal('/kontaktskjema'),
  email: z.literal('kundeservice@utekos.no'),
  phone: z.literal('+4740216343'),
  reason: z.enum([
    'order',
    'payment',
    'complaint',
    'personal_data',
    'uncertain',
    'repeated_failure'
  ])
})

const statusSchema = z.strictObject({
  confidence: z.enum(['high', 'medium', 'low']),
  failureCode: z.enum([
    'none',
    'shopify_unavailable',
    'knowledge_unavailable',
    'recommendation_unavailable',
    'no_grounded_answer'
  ])
})

export type AssistantTextRow = {
  kind: 'text'
  id: string
  messageId: string
  role: 'user' | 'assistant'
  text: string
}

export type AssistantRecommendationRow = {
  kind: 'recommendation'
  id: string
  messageId: string
  recommendation: AssistantRecommendation
}

export type AssistantSourceRow = {
  kind: 'source'
  id: string
  messageId: string
  source: AssistantSource
}

export type AssistantHandoffRow = {
  kind: 'handoff'
  id: string
  messageId: string
  handoff: {
    contactPath: '/kontaktskjema'
    emailHref: 'mailto:kundeservice@utekos.no'
    emailLabel: 'kundeservice@utekos.no'
    phoneHref: 'tel:+4740216343'
    phoneLabel: '+47 40 21 63 43'
    reason: AssistantHandoff['reason']
  }
}

export type AssistantStatusRow = {
  kind: 'status'
  id: string
  messageId: string
  confidence: 'high' | 'medium' | 'low'
  failureCode:
    | 'none'
    | 'shopify_unavailable'
    | 'knowledge_unavailable'
    | 'recommendation_unavailable'
    | 'no_grounded_answer'
}

export type AssistantViewRow =
  | AssistantTextRow
  | AssistantRecommendationRow
  | AssistantSourceRow
  | AssistantHandoffRow
  | AssistantStatusRow

export function allowsAssistantSurface(rolloutPercent: number) {
  return (
    Number.isFinite(rolloutPercent) &&
    rolloutPercent > 0 &&
    rolloutPercent <= 100
  )
}

function createRow(
  message: AssistantUIMessage,
  part: AssistantUIMessage['parts'][number],
  partIndex: number
): AssistantViewRow | null {
  if (part.type === 'text') {
    if (
      (message.role !== 'user' &&
        message.role !== 'assistant') ||
      part.text.trim().length === 0
    ) {
      return null
    }

    return {
      kind: 'text',
      id: `${message.id}:text:${partIndex}`,
      messageId: message.id,
      role: message.role,
      text: part.text
    }
  }

  if (part.type === 'data-recommendation') {
    const parsed = recommendationSchema.safeParse(part.data)
    if (!parsed.success) return null

    return {
      kind: 'recommendation',
      id: `${message.id}:recommendation:${partIndex}`,
      messageId: message.id,
      recommendation: {
        ...parsed.data,
        product: {
          ...parsed.data.product,
          href: `/produkter/${parsed.data.product.handle}`
        }
      }
    }
  }

  if (part.type === 'data-source') {
    const parsed = assistantSourceSchema.safeParse(part.data)
    if (!parsed.success) return null

    return {
      kind: 'source',
      id: `${message.id}:source:${partIndex}`,
      messageId: message.id,
      source: parsed.data
    }
  }

  if (part.type === 'data-handoff') {
    const parsed = handoffSchema.safeParse(part.data)
    if (!parsed.success) return null

    return {
      kind: 'handoff',
      id: `${message.id}:handoff:${partIndex}`,
      messageId: message.id,
      handoff: {
        contactPath: parsed.data.contactPath,
        emailHref: 'mailto:kundeservice@utekos.no',
        emailLabel: parsed.data.email,
        phoneHref: 'tel:+4740216343',
        phoneLabel: '+47 40 21 63 43',
        reason: parsed.data.reason
      }
    }
  }

  if (part.type === 'data-status') {
    const parsed = statusSchema.safeParse(part.data)
    if (!parsed.success) return null

    return {
      kind: 'status',
      id: `${message.id}:status:${partIndex}`,
      messageId: message.id,
      confidence: parsed.data.confidence,
      failureCode: parsed.data.failureCode
    }
  }

  return null
}

export function createAssistantViewRows(
  messages: AssistantUIMessage[]
): AssistantViewRow[] {
  return messages.flatMap(message =>
    message.parts.flatMap((part, partIndex) => {
      const row = createRow(message, part, partIndex)
      return row ? [row] : []
    })
  )
}

function redactPrivateValues(value: string) {
  return value
    .replace(EMAIL_PATTERN, REDACTION)
    .replace(PAYMENT_NUMBER_PATTERN, REDACTION)
    .replace(ORDER_NUMBER_PATTERN, REDACTION)
    .replace(HASHED_NUMBER_PATTERN, REDACTION)
    .replace(PHONE_NUMBER_PATTERN, REDACTION)
    .replace(/\s+/gu, ' ')
    .trim()
}

function boundSummary(value: string) {
  if (value.length <= MAX_SUMMARY_CHARACTERS) return value

  return `${value.slice(0, MAX_SUMMARY_CHARACTERS - 1).trimEnd()}…`
}

export function createHandoffSummary(
  messages: AssistantUIMessage[]
): string {
  const summary = messages
    .filter(
      message =>
        message.role === 'user' || message.role === 'assistant'
    )
    .flatMap(message => {
      const speaker =
        message.role === 'user' ? 'Du' : 'Kjøpshjelp'

      return message.parts.flatMap(part =>
        part.type === 'text' && part.text.trim() ?
          [`${speaker}: ${redactPrivateValues(part.text)}`]
        : []
      )
    })
    .join('\n')

  return boundSummary(summary)
}
