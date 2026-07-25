import type { UIMessage } from 'ai'
import { z } from 'zod'

export const assistantIntentSchema = z.enum([
  'product_help',
  'size_help',
  'stock_help',
  'shipping_returns',
  'other'
])

const textPartSchema = z.strictObject({
  type: z.literal('text'),
  text: z.string().trim().min(1).max(800)
})

const messageSchema = z.strictObject({
  id: z.string().min(1).max(100),
  role: z.enum(['user', 'assistant']),
  parts: z.array(textPartSchema).min(1).max(4)
})

export const assistantChatRequestSchema = z.object({
  id: z.string().max(100).optional(),
  sessionId: z.string().uuid(),
  intent: assistantIntentSchema,
  messages: z.array(messageSchema).min(1).max(12),
  pageContext: z.strictObject({
    pathname: z.string().startsWith('/').max(300),
    productHandle: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .nullable()
  })
})

export type AssistantIntent = z.infer<
  typeof assistantIntentSchema
>
export type AssistantChatRequest = z.infer<
  typeof assistantChatRequestSchema
>

const assistantSelectedOptionSchema = z.strictObject({
  name: z.string().trim().min(1),
  value: z.string().trim().min(1)
})

const assistantVariantSchema = z.strictObject({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  availableForSale: z.boolean(),
  selectedOptions: z.array(assistantSelectedOptionSchema)
})

const assistantProductImageSchema = z
  .strictObject({
    alt: z.string().trim().min(1),
    url: z.string().url()
  })
  .refine(
    image =>
      new URL(image.url).origin === 'https://cdn.shopify.com',
    'Product images must use the Shopify CDN origin'
  )

export const assistantProductSchema = z
  .strictObject({
    id: z.string().trim().min(1),
    handle: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    title: z.string().trim().min(1),
    href: z.string().startsWith('/produkter/'),
    availableForSale: z.boolean(),
    image: assistantProductImageSchema.nullable(),
    price: z.strictObject({
      amount: z.string().regex(/^\d+(?:\.\d+)?$/u),
      currencyCode: z.string().regex(/^[A-Z]{3}$/u)
    }),
    variants: z.array(assistantVariantSchema)
  })
  .refine(
    product => product.href === `/produkter/${product.handle}`,
    'Product href must match its canonical handle path'
  )

export type AssistantProduct = z.infer<
  typeof assistantProductSchema
>

export const assistantRecommendationSchema = z.strictObject({
  product: assistantProductSchema,
  rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason: z.string().trim().min(1).max(500),
  isPrimary: z.boolean()
})

export type AssistantRecommendation = z.infer<
  typeof assistantRecommendationSchema
>

export type AssistantHandoff = {
  contactPath: '/kontaktskjema'
  email: 'kundeservice@utekos.no'
  phone: '+4740216343'
  reason:
    | 'order'
    | 'payment'
    | 'complaint'
    | 'personal_data'
    | 'uncertain'
    | 'repeated_failure'
}

export const assistantSourceSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  url: z
    .string()
    .url()
    .refine(
      value => new URL(value).origin === 'https://utekos.no',
      'Source must use the canonical Utekos origin'
    )
})

export type AssistantSource = z.infer<
  typeof assistantSourceSchema
>

export type AssistantDataParts = {
  recommendation: AssistantRecommendation
  handoff: AssistantHandoff
  source: AssistantSource
  status: {
    confidence: 'high' | 'medium' | 'low'
    failureCode:
      | 'none'
      | 'shopify_unavailable'
      | 'knowledge_unavailable'
      | 'recommendation_unavailable'
      | 'no_grounded_answer'
  }
}

export type AssistantUIMessage = UIMessage<
  { confidence: 'high' | 'medium' | 'low' },
  AssistantDataParts
>

export function parseAssistantChatRequest(
  value: unknown
): AssistantChatRequest {
  return assistantChatRequestSchema.parse(value)
}

export function getLastUserText(
  messages: AssistantChatRequest['messages']
) {
  const message = messages.findLast(
    candidate => candidate.role === 'user'
  )

  return (
    message?.parts
      .map(part => part.text)
      .join('\n')
      .trim() ?? ''
  )
}

export function projectTextOnlyMessages(
  messages: AssistantUIMessage[]
) {
  return messages
    .filter(
      message =>
        message.role === 'user' || message.role === 'assistant'
    )
    .slice(-12)
    .map(message => ({
      id: message.id,
      role: message.role,
      parts: message.parts.flatMap(part =>
        part.type === 'text' ?
          [{ type: 'text' as const, text: part.text }]
        : []
      )
    }))
    .filter(message => message.parts.length > 0)
}
