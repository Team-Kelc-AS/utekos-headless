import { z } from 'zod'
import {
  assistantSourceSchema,
  type AssistantProduct,
  type AssistantSource
} from '../assistantProtocol'

export type SupportKnowledgeResult = {
  text: string
  confidence: 'high' | 'medium' | 'low'
  sources: AssistantSource[]
}

export interface SupportKnowledgeAdapter {
  answer(input: {
    question: string
    productHandle: string | null
  }): Promise<SupportKnowledgeResult>
}

export interface CommerceRecommendationAdapter {
  recommend(input: {
    productIds: string[]
    sessionId: string
  }): Promise<string[]>
}

export type AssistantRequestContext = {
  buyerIp?: string
  failureCount: number
}

export type AssistantAdapters = {
  fetchProducts(input: {
    buyerIp?: string
    handles?: string[]
  }): Promise<AssistantProduct[]>
  supportKnowledge: SupportKnowledgeAdapter
  commerceRecommendation: CommerceRecommendationAdapter
}

const selectedOptionSchema = z.strictObject({
  name: z.string(),
  value: z.string()
})

const assistantVariantSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  availableForSale: z.boolean(),
  selectedOptions: z.array(selectedOptionSchema)
})

const assistantProductSchema: z.ZodType<AssistantProduct> =
  z.strictObject({
    id: z.string(),
    handle: z.string(),
    title: z.string(),
    href: z.string(),
    image: z
      .strictObject({ alt: z.string(), url: z.string() })
      .nullable(),
    price: z.strictObject({
      amount: z.string(),
      currencyCode: z.string()
    }),
    variants: z.array(assistantVariantSchema)
  })

export const assistantProductsResultSchema = z.array(
  assistantProductSchema
)

export const supportKnowledgeResultSchema = z.strictObject({
  text: z.string().trim().min(1).max(2_000),
  confidence: z.enum(['high', 'medium', 'low']),
  sources: z.array(assistantSourceSchema).max(5)
})

export const commerceRecommendationResultSchema = z
  .array(z.string().trim().min(1).max(300))
  .max(3)

export const staticCommerceRecommendationAdapter: CommerceRecommendationAdapter =
  {
    async recommend() {
      return []
    }
  }
