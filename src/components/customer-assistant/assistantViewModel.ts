import {
  assistantSourceSchema,
  parseAssistantChatRequest,
  projectTextOnlyMessages,
  type AssistantChatRequest,
  type AssistantHandoff,
  type AssistantRecommendation,
  type AssistantSource,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { z } from 'zod'

const MAX_SUMMARY_CHARACTERS = 1_000
const MAX_REQUEST_MESSAGES = 12
const MAX_REQUEST_PARTS = 4
const MAX_REQUEST_TEXT_CHARACTERS = 800
const MAX_REQUEST_ID_CHARACTERS = 100
const MAX_PATHNAME_CHARACTERS = 300
const MAX_PRODUCT_HANDLE_CHARACTERS = 160
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const PAGE_HANDLE_PATTERN = /^[a-z0-9-]+$/u
const EMAIL_PATTERN =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu
const PAYMENT_NUMBER_PATTERN =
  /(?<![\p{L}\p{N}])(?:\d[\s-]?){12,18}\d(?![\p{L}\p{N}])/gu
const ORDER_NUMBER_PATTERN =
  /\b(?:bestilling(?:snummer|snr)?|ordre(?:nummer|nr)?|ord(?:er)?)(?:[\s.:#-]+)(?=[A-Z0-9-]*\d)[A-Z0-9-]{4,}\b/giu
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

export type AssistantChatStatus =
  | 'submitted'
  | 'streaming'
  | 'ready'
  | 'error'

export type AssistantFeedbackValue = 'helpful' | 'not_helpful'

export type AssistantFeedbackState = Readonly<
  Record<string, AssistantFeedbackValue>
>

export type CompletedAssistantAnnouncement = {
  messageId: string
  text: string
}

type AssistantRequestBoundaryInput = {
  id?: unknown
  sessionId: unknown
  intent: unknown
  messages: AssistantUIMessage[]
  pathname: unknown
  productHandle: unknown
}

export function allowsAssistantSurface(rolloutPercent: number) {
  return (
    Number.isFinite(rolloutPercent) &&
    rolloutPercent > 0 &&
    rolloutPercent <= 100
  )
}

function createBoundedRequestId(value: unknown) {
  if (typeof value !== 'string') return undefined

  const id = value.trim().slice(0, MAX_REQUEST_ID_CHARACTERS)
  return id || undefined
}

function createBoundedPathname(value: unknown) {
  if (typeof value !== 'string') return '/'

  const pathname = value.trim()
  if (!pathname.startsWith('/')) return '/'

  return pathname.slice(0, MAX_PATHNAME_CHARACTERS)
}

function createValidatedProductHandle(value: unknown) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_PRODUCT_HANDLE_CHARACTERS ||
    !PAGE_HANDLE_PATTERN.test(value)
  ) {
    return null
  }

  return value
}

export function createAssistantRequestBody(
  input: AssistantRequestBoundaryInput
): AssistantChatRequest {
  const messages = projectTextOnlyMessages(input.messages)
    .slice(-MAX_REQUEST_MESSAGES)
    .flatMap(message => {
      const id = message.id
        .trim()
        .slice(0, MAX_REQUEST_ID_CHARACTERS)
      const parts = message.parts
        .flatMap(part => {
          const text = part.text
            .trim()
            .slice(0, MAX_REQUEST_TEXT_CHARACTERS)
            .trimEnd()

          return text ? [{ type: 'text' as const, text }] : []
        })
        .slice(0, MAX_REQUEST_PARTS)

      return id && parts.length > 0 ?
          [{ id, role: message.role, parts }]
        : []
    })

  return parseAssistantChatRequest({
    id: createBoundedRequestId(input.id),
    sessionId: input.sessionId,
    intent: input.intent,
    messages,
    pageContext: {
      pathname: createBoundedPathname(input.pathname),
      productHandle: createValidatedProductHandle(
        input.productHandle
      )
    }
  })
}

export function recordAssistantFeedback(
  current: AssistantFeedbackState,
  responseId: string,
  value: AssistantFeedbackValue
): AssistantFeedbackState {
  if (!responseId || current[responseId]) return current

  return { ...current, [responseId]: value }
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

export function createCompletedAssistantAnnouncement(
  messages: AssistantUIMessage[],
  status: AssistantChatStatus
): CompletedAssistantAnnouncement | null {
  if (status !== 'ready') return null

  const message = messages.findLast(
    candidate => candidate.role === 'assistant'
  )
  if (!message) return null

  const rows = createAssistantViewRows([message])
  const hasCompletionStatus = rows.some(
    row => row.kind === 'status'
  )
  if (!hasCompletionStatus) return null

  const text = rows
    .flatMap(row =>
      row.kind === 'text' && row.role === 'assistant' ?
        [row.text.trim()]
      : []
    )
    .filter(Boolean)
    .join(' ')
  if (!text) return null

  return { messageId: message.id, text: `Kjøpshjelp: ${text}` }
}

export function resolveAssistantAnnouncementText(
  announcement: CompletedAssistantAnnouncement | null,
  isOpen: boolean,
  suppressedMessageId: string | null
) {
  if (
    !isOpen ||
    !announcement ||
    announcement.messageId === suppressedMessageId
  ) {
    return ''
  }

  return announcement.text
}

export function resolveCompletedAssistantSuppressionId(
  announcement: CompletedAssistantAnnouncement | null
) {
  return announcement?.messageId ?? null
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
